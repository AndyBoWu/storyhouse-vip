import { useState, useEffect } from "react";

// Fix BigInt serialization globally for this module
if (typeof BigInt !== "undefined" && !BigInt.prototype.toJSON) {
  BigInt.prototype.toJSON = function () {
    return this.toString();
  };
}
import { useAccount } from "wagmi";
import { Address, Hash } from "viem";
import { apiClient } from "@/lib/api-client";
import { PublishResult } from "@/lib/contracts/storyProtocol";
import { createClientStoryProtocolService } from "@/lib/services/storyProtocolClient";
import { useBookRegistration } from "./useBookRegistration";

interface StoryData {
  title: string;
  content: string;
  wordCount: number;
  readingTime: number;
  themes: string[];
  chapterNumber: number;
  contentUrl?: string; // R2 URL from story generation
}

interface PublishOptions {
  publishingOption: "simple" | "protected";
  chapterPrice: number;
  ipRegistration?: boolean;
  licenseTier: "free" | "reading" | "premium" | "exclusive";
}

type UnifiedPublishStep =
  | "idle"
  | "checking-unified-support"
  | "unified-registration"
  | "generating-metadata"
  | "blockchain-transaction"
  | "saving-to-storage"
  | "setting-attribution"
  | "success"
  | "error";

interface UnifiedPublishResult extends PublishResult {
  method?: "unified" | "legacy";
  gasOptimized?: boolean;
  metadataUri?: string;
  warning?: string;
  requiresRegistration?: boolean;
}

export function useUnifiedPublishStory() {
  const [currentStep, setCurrentStep] = useState<UnifiedPublishStep>("idle");
  const [publishResult, setPublishResult] =
    useState<UnifiedPublishResult | null>(null);
  const [isUnifiedSupported, setIsUnifiedSupported] = useState<boolean | null>(
    null,
  );
  const [tokenId, setTokenId] = useState<bigint | null>(null);
  const [ipAssetId, setIPAssetId] = useState<Address | null>(null);
  const [showRegistrationFlow, setShowRegistrationFlow] = useState(false);
  const [pendingPublishData, setPendingPublishData] = useState<{
    storyData: StoryData;
    options: PublishOptions;
    bookId?: string;
    bookMetadata?: any;
    isDerivative?: boolean;
  } | null>(null);

  const { address } = useAccount();
  const { setChapterAttribution, checkBookRegistration, registerBook } =
    useBookRegistration();

  // Check unified registration support on mount
  useEffect(() => {
    checkUnifiedSupport();
  }, []);

  const checkUnifiedSupport = async () => {
    try {
      const response = await apiClient.checkUnifiedRegistration();
      setIsUnifiedSupported(response.enabled && response.available);
      console.log("🔍 Unified registration support:", response);
    } catch (error) {
      console.warn("⚠️ Could not check unified registration support:", error);
      setIsUnifiedSupported(false);
    }
  };

  const publishStoryUnified = async (
    storyData: StoryData,
    options: PublishOptions,
    bookId?: string,
  ): Promise<UnifiedPublishResult> => {
    console.log("🚀 publishStoryUnified called with:", {
      storyData,
      options,
      bookId,
      address,
    });

    if (!address) {
      const error = "Wallet not connected";
      setPublishResult({ success: false, error });
      return { success: false, error };
    }

    try {
      setCurrentStep("checking-unified-support");

      // Always use unified registration for IP-protected content
      if (options.ipRegistration && options.publishingOption === "protected") {
        console.log("🚀 Using unified registration (single transaction)");
        return await executeUnifiedRegistration(storyData, options, bookId);
      } else {
        // Simple publishing without IP registration
        throw new Error(
          "Simple publishing without IP registration is not supported. Please enable IP registration.",
        );
      }
    } catch (error) {
      console.error("❌ Publishing failed:", error);
      setCurrentStep("error");

      let errorMessage = "Unknown error occurred";
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      // Handle common errors
      if (errorMessage.includes("User rejected")) {
        errorMessage = "Transaction was rejected. Please try again.";
      } else if (errorMessage.includes("timeout")) {
        errorMessage =
          "Operation timed out. Please check your connection and try again.";
      }

      const result: UnifiedPublishResult = {
        success: false,
        error: errorMessage,
      };
      setPublishResult(result);
      return result;
    }
  };

  const executeUnifiedRegistration = async (
    storyData: StoryData,
    options: PublishOptions,
    bookId?: string,
  ): Promise<UnifiedPublishResult> => {
    setCurrentStep("unified-registration");
    console.log("🔗 Executing unified IP registration on client-side...");

    const nftContract = process.env
      .NEXT_PUBLIC_STORY_SPG_NFT_CONTRACT as Address;

    if (!nftContract) {
      throw new Error("SPG NFT Contract not configured");
    }

    // Check if this is a derivative book that needs registration
    let bookMetadata = null;
    let isDerivativeNeedingRegistration = false;
    let parentIpAssetId: string | null = null;
    let parentLicenseTermsId: string | null = null;

    if (bookId) {
      try {
        // Check if book is registered in HybridRevenueController
        const registrationStatus =
          await apiClient.checkBookRegistrationStatus(bookId);
        if (!registrationStatus.data?.isRegistered) {
          console.log("⚠️ Book not registered in revenue controller");

          // Return a special result indicating registration is needed
          const result: UnifiedPublishResult = {
            success: false,
            error: "Book needs to be registered for revenue sharing first",
            requiresRegistration: true,
          };
          setPublishResult(result);
          setCurrentStep("error");
          return result;
        }

        const bookData = await apiClient.getBookById(bookId);
        bookMetadata = bookData;

        // Check if this is a derivative book
        if (bookMetadata.parentBook) {
          console.log("🌿 Detected derivative book");

          // For derivatives, we always register chapters individually
          // We never register the book itself as an IP asset
          isDerivativeNeedingRegistration = true;
          console.log(
            "📝 Will register this chapter individually (not book-level IP)",
          );
        }
      } catch (error) {
        console.warn("Could not fetch book metadata:", error);
      }
    }

    // Step 1: Generate and store metadata via backend
    setCurrentStep("generating-metadata");
    console.log("📝 Generating metadata...");

    const storyForMetadata = {
      id: `${address!.toLowerCase()}-${Date.now()}`,
      title: storyData.title,
      content: storyData.content,
      author: address!,
      genre: storyData.themes[0] || "Fiction",
      mood: storyData.themes[1] || "Neutral",
      createdAt: new Date().toISOString(),
    };

    let metadataUri: string | undefined;
    let metadataHash: Hash | undefined;

    try {
      // Call backend to generate and store metadata only
      const metadataResult = await apiClient.generateIPMetadata({
        story: storyForMetadata,
        licenseTier: options.licenseTier,
      });

      if (metadataResult.success && metadataResult.data) {
        metadataUri = metadataResult.data.metadataUri;
        metadataHash = metadataResult.data.metadataHash as Hash;
        console.log("✅ Metadata generated:", {
          uri: metadataUri,
          hash: metadataHash,
        });
      }
    } catch (error) {
      console.warn(
        "⚠️ Failed to generate metadata, proceeding without:",
        error,
      );
    }

    try {
      // Step 2: Execute blockchain transaction with user's wallet
      setCurrentStep("blockchain-transaction");
      console.log("🔗 Executing blockchain transaction with user wallet...");

      // Initialize client-side Story Protocol service
      const storyProtocolClient = createClientStoryProtocolService(address!);
      let registrationResult;

      // IMPORTANT: For derivative books, we only register the individual chapter
      // We do NOT register the entire derivative book as an IP asset
      if (isDerivativeNeedingRegistration && bookMetadata?.parentBook) {
        console.log("🌿 Publishing new chapter in derivative book...");
        console.log(
          "📝 Only registering this specific chapter as IP, not the entire book",
        );

        // Add metadata indicating this is a derivative chapter
        const enhancedMetadata = {
          ...(metadataUri && { ipMetadataURI: metadataUri }),
          ...(metadataHash && { ipMetadataHash: metadataHash }),
          nftMetadataURI: metadataUri,
          nftMetadataHash: metadataHash,
          // Additional metadata to indicate derivative chapter
          attributes: [
            { trait_type: "type", value: "derivative_chapter" },
            {
              trait_type: "chapter_number",
              value: storyData.chapterNumber.toString(),
            },
            { trait_type: "parent_book", value: bookMetadata.parentBook },
            { trait_type: "derivative_book", value: bookId },
          ],
        };

        // Register only this chapter, not as a derivative of parent IP
        registrationResult =
          await storyProtocolClient.mintAndRegisterWithPilTerms({
            spgNftContract: nftContract,
            metadata: enhancedMetadata,
            licenseTier: options.licenseTier,
            recipient: address!,
          });
        console.log("✅ Derivative chapter registration complete!");

        // Note: We do NOT update the book's IP asset ID because derivative books
        // should not have book-level IP assets, only chapter-level
      } else {
        // For original books, check if this is the moment to register book-level IP
        const shouldRegisterBookIP =
          storyData.chapterNumber === 3 &&
          !bookMetadata?.ipAssetId &&
          !bookMetadata?.parentBook;

        if (shouldRegisterBookIP) {
          console.log(
            "🎉 Author publishing chapter 3 - registering book-level IP!",
          );

          // Check if author owns chapters 1-2 as well
          const bookOwnershipCheck = await apiClient.checkBookOwnership(
            bookId!,
          );
          if (bookOwnershipCheck.data?.canRegisterBookIP) {
            // Register book-level IP with special metadata
            const bookMetadata = {
              ...(metadataUri && { ipMetadataURI: metadataUri }),
              ...(metadataHash && { ipMetadataHash: metadataHash }),
              nftMetadataURI: metadataUri,
              nftMetadataHash: metadataHash,
              attributes: [
                { trait_type: "type", value: "book_ip" },
                { trait_type: "book_id", value: bookId },
                { trait_type: "total_chapters", value: "3" },
                { trait_type: "ip_owner", value: address },
              ],
            };

            registrationResult =
              await storyProtocolClient.mintAndRegisterWithPilTerms({
                spgNftContract: nftContract,
                metadata: bookMetadata,
                licenseTier: options.licenseTier,
                recipient: address!,
              });
            console.log("✅ Book-level IP registration complete!");

            // Update book metadata with IP asset ID
            if (registrationResult.success && registrationResult.ipId) {
              await apiClient.updateBookIP(bookId!, {
                ipAssetId: registrationResult.ipId as string,
                transactionHash: registrationResult.txHash as string,
                licenseTermsId: registrationResult.licenseTermsId?.toString(),
              });
            }
          } else {
            console.log(
              "⚠️ Author does not own chapters 1-2, registering chapter only",
            );
            // Fall through to regular chapter registration
          }
        }

        // If not registering book IP, just register the chapter
        if (!shouldRegisterBookIP || !registrationResult) {
          registrationResult =
            await storyProtocolClient.mintAndRegisterWithPilTerms({
              spgNftContract: nftContract,
              metadata: {
                ipMetadataURI: metadataUri,
                ipMetadataHash: metadataHash,
                nftMetadataURI: metadataUri,
                nftMetadataHash: metadataHash,
              },
              licenseTier: options.licenseTier,
              recipient: address!,
            });
        }
      }

      const registeredIPAssetId = registrationResult.ipId as Address;
      const transactionHash = registrationResult.txHash as Hash;
      const mintedTokenId = BigInt(registrationResult.tokenId || Date.now());

      setTokenId(mintedTokenId);
      setIPAssetId(registeredIPAssetId);

      console.log("✅ Unified registration complete!");
      console.log("🎫 Token ID:", mintedTokenId.toString());
      console.log("📝 IP Asset ID:", registeredIPAssetId);
      console.log("🔗 Transaction:", transactionHash);
      console.log("📄 License Terms ID:", registrationResult.licenseTermsId);
      console.log("🌐 Metadata URI:", metadataUri);

      // Step 3: Save chapter content to R2 storage
      setCurrentStep("saving-to-storage");
      console.log("💾 Saving chapter content to R2 storage...");

      // Ensure bookId is in the correct format: authorAddress/slug
      let finalBookId = bookId;
      if (!finalBookId) {
        // If no bookId provided, create one with proper format
        const slug = storyData.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        finalBookId = `${address!.toLowerCase()}/${slug}`;
      } else if (!finalBookId.includes("/")) {
        // If bookId doesn't have slash, it's likely in wrong format, fix it
        // Extract author address and slug from the bookId
        const parts = finalBookId.split("-");
        if (parts[0].startsWith("0x") && parts[0].length === 42) {
          // Format: 0xaddress-slug-parts -> 0xaddress/slug-parts
          const authorAddr = parts[0];
          const slug = parts.slice(1).join("-");
          finalBookId = `${authorAddr}/${slug}`;
        }
      }

      const saveResult = await apiClient.saveBookChapter(finalBookId, {
        bookId: finalBookId,
        chapterNumber: storyData.chapterNumber,
        title: storyData.title,
        content: storyData.content,
        wordCount: storyData.wordCount,
        readingTime: storyData.readingTime,
        authorAddress: address!.toLowerCase(),
        authorName: `${address!.slice(-4)}`,
        ipAssetId: registeredIPAssetId,
        transactionHash: transactionHash,
        licenseTermsId: registrationResult.licenseTermsId
          ? registrationResult.licenseTermsId.toString()
          : undefined,
        genre: storyData.themes[0] || "General",
        generationMethod: "human" as const,
      });

      console.log(
        "✅ Chapter content saved to R2:",
        saveResult.data?.contentUrl,
      );

      // Step 4: Set chapter attribution for revenue sharing (for paid chapters)
      if (storyData.chapterNumber > 3) {
        setCurrentStep("setting-attribution");
        console.log("💰 Setting chapter attribution for revenue sharing...");

        try {
          // First ensure the book is registered
          const isBookRegistered = await checkBookRegistration(finalBookId);
          if (!isBookRegistered) {
            console.log("📚 Book not registered, showing registration flow...");

            // For derivatives, show the special registration flow
            if (isDerivativeNeedingRegistration || bookMetadata?.parentBook) {
              // Store the publishing data for later
              setPendingPublishData({
                storyData,
                options,
                bookId: finalBookId,
                bookMetadata,
                isDerivative: true,
              });

              // Show the registration flow modal
              setShowRegistrationFlow(true);
              setCurrentStep("idle"); // Reset step while waiting

              // Return a pending result - actual publishing will happen after registration
              return {
                success: false,
                error: "Registration required",
                requiresRegistration: true,
              };
            }

            // For regular books, use simple alert
            alert(
              "📚 Book Registration Required\n\nYour book needs to be registered for revenue sharing. You will see a MetaMask transaction request.",
            );

            const registerResult = await registerBook({
              bookId: finalBookId,
              totalChapters: 100, // Current contract maximum (will be increased when contract is redeployed)
              isDerivative: isDerivativeNeedingRegistration || false,
              parentBookId: isDerivativeNeedingRegistration
                ? bookMetadata?.parentBook
                : undefined,
              ipfsMetadataHash: metadataUri || "",
            });

            if (registerResult.pending) {
              // Book registration is pending, but we can continue with a warning
              console.warn(
                "⚠️ Book registration pending:",
                registerResult.message,
              );
              alert(
                "⚠️ Book Registration Pending\n\n" +
                  "Your book registration transaction is still pending. " +
                  "The chapter has been saved, but pricing may not work until the registration completes.\n\n" +
                  "Please check your wallet for any pending transactions.",
              );
              // Continue with publishing, but skip attribution for now
              console.log(
                "📝 Skipping attribution due to pending book registration",
              );

              // Success with warning
              setCurrentStep("success");
              const unifiedResult: UnifiedPublishResult = {
                success: true,
                method: "unified",
                gasOptimized: true,
                data: {
                  transactionHash,
                  ipAssetId: registeredIPAssetId,
                  tokenId: mintedTokenId,
                  licenseTermsId: undefined, // No license terms ID available yet
                  contentUrl: saveResult.data?.contentUrl,
                  explorerUrl: `https://aeneid.storyscan.io/tx/${transactionHash}`,
                },
                metadataUri: metadataUri,
                warning:
                  "Book registration pending - chapter pricing may be delayed",
              };
              setPublishResult(unifiedResult);
              return unifiedResult;
            } else if (!registerResult.success) {
              // This is critical for paid chapters - throw error to stop publish
              throw new Error(
                `Book registration failed: ${registerResult.error || "Unknown error"}. Cannot publish paid chapters without revenue registration.`,
              );
            } else {
              // Wait a moment for registration to confirm
              console.log("⏳ Waiting for book registration to confirm...");
              await new Promise((resolve) => setTimeout(resolve, 3000));
            }
          }

          // Set chapter attribution with pricing
          // For chapters 1-3: price is 0, for 4+: use the specified price (default 0.5 TIP)
          const chapterPrice =
            storyData.chapterNumber <= 3
              ? "0"
              : (options.chapterPrice || 0.5).toString();

          console.log("📝 Setting attribution with price:", {
            bookId: finalBookId,
            chapterNumber: storyData.chapterNumber,
            price: `${chapterPrice} TIP`,
            originalAuthor: address,
          });

          // Alert user about the second transaction
          alert(
            `💰 Chapter Pricing Setup\n\nNow you need to set the unlock price (${chapterPrice} TIP) for this chapter. You will see another MetaMask transaction request.`,
          );

          const attributionResult = await setChapterAttribution({
            bookId: finalBookId,
            chapterNumber: storyData.chapterNumber,
            originalAuthor: address!,
            unlockPrice: chapterPrice,
            isOriginalContent: true,
          });

          if (attributionResult.pending) {
            console.log(
              "⏳ Attribution transaction initiated:",
              attributionResult.message,
            );

            // For paid chapters, give user a chance to complete the transaction
            if (storyData.chapterNumber > 3) {
              // Wait a bit for user to interact with wallet
              console.log(
                "⏳ Waiting for user to approve transaction in wallet...",
              );
              await new Promise((resolve) => setTimeout(resolve, 5000)); // Give user 5 seconds to approve

              // Then start polling for confirmation
              let attributionSet = false;
              let attempts = 0;
              const maxAttempts = 25; // 25 seconds additional wait

              console.log(
                "🔍 Checking if attribution was set on blockchain...",
              );

              while (!attributionSet && attempts < maxAttempts) {
                attempts++;

                try {
                  // Check attribution directly from blockchain
                  const checkResult = await apiClient.get(
                    `/books/${encodeURIComponent(finalBookId)}/chapter/${storyData.chapterNumber}/attribution`,
                  );

                  // Check if attribution is set on blockchain
                  if (
                    checkResult &&
                    checkResult.attribution &&
                    checkResult.attribution.isSet
                  ) {
                    attributionSet = true;
                    console.log(
                      "✅ Chapter attribution confirmed on blockchain!",
                      checkResult.attribution,
                    );
                    break;
                  }
                } catch (checkError) {
                  // Attribution not yet set, continue waiting
                  if (attempts % 5 === 0) {
                    console.log(
                      `Still waiting for attribution confirmation... (${attempts}/${maxAttempts})`,
                    );
                  }
                }

                // Wait 1 second before next check
                await new Promise((resolve) => setTimeout(resolve, 1000));
              }

              if (!attributionSet) {
                // Attribution not confirmed yet, but don't fail the publish
                console.warn("⚠️ Attribution transaction may still be pending");
                alert(
                  "⚠️ Chapter Pricing Transaction Pending\n\n" +
                    "Your chapter has been published, but the pricing transaction may still be processing.\n\n" +
                    "Please check your wallet to ensure the transaction was submitted. " +
                    "Readers will not be able to unlock this chapter until the pricing is confirmed on the blockchain.",
                );
              }
            } else {
              // For free chapters, just continue
              console.log(
                "📝 Free chapter - attribution transaction initiated, continuing...",
              );
            }
          } else if (attributionResult.success && !attributionResult.pending) {
            console.log("✅ Chapter attribution set successfully!");
          } else if (!attributionResult.success) {
            // Failed to initiate transaction
            throw new Error(
              `Failed to set chapter pricing: ${attributionResult.error || "Unknown error"}. The transaction could not be initiated.`,
            );
          }
        } catch (attributionError) {
          console.error("❌ Attribution setting failed:", attributionError);

          // Check for specific "invalid chapter" error
          const errorMessage = attributionError instanceof Error ? attributionError.message : String(attributionError);
          if (errorMessage.includes("invalid chapter") || errorMessage.includes("HybridRevenueV2: invalid chapter")) {
            throw new Error(
              `Chapter ${storyData.chapterNumber} cannot be added to this book. The book was registered with too few total chapters. ` +
              `Please contact support to increase the book's chapter limit, or try creating a new book for additional chapters.`
            );
          }

          // For paid chapters, this is a critical error that should stop publishing
          if (storyData.chapterNumber > 3) {
            // Clean up by trying to remove the saved chapter
            console.log(
              "🧹 Attempting to clean up saved chapter due to attribution failure...",
            );

            try {
              // Delete the chapter from backend
              await apiClient.delete(
                `/chapters/${encodeURIComponent(finalBookId)}/${storyData.chapterNumber}`,
              );
              console.log("✅ Chapter cleaned up successfully");
            } catch (cleanupError) {
              console.error("❌ Failed to clean up chapter:", cleanupError);
            }

            // Re-throw with user-friendly message
            throw new Error(
              `Failed to set chapter pricing. The chapter was not published. ${attributionError instanceof Error ? attributionError.message : "Unknown error"}. ` +
                `Please try again or contact support if the issue persists.`,
            );
          } else {
            // For free chapters, log but continue
            console.warn(
              "⚠️ Attribution failed for free chapter, continuing...",
            );
          }
        }
      } else {
        console.log("📝 Free chapter (1-3) - setting attribution with 0 price");
        // Even for free chapters, we should set attribution to track the author
        try {
          const attributionResult = await setChapterAttribution({
            bookId: finalBookId,
            chapterNumber: storyData.chapterNumber,
            originalAuthor: address!,
            unlockPrice: "0",
            isOriginalContent: true,
          });

          if (!attributionResult.success) {
            console.warn(
              "⚠️ Failed to set attribution for free chapter:",
              attributionResult.error,
            );
          }
        } catch (error) {
          console.warn(
            "⚠️ Non-critical: Failed to set attribution for free chapter",
            error,
          );
        }
      }

      // Success!
      setCurrentStep("success");
      const unifiedResult: UnifiedPublishResult = {
        success: true,
        method: "unified",
        gasOptimized: true,
        data: {
          transactionHash,
          ipAssetId: registeredIPAssetId,
          tokenId: mintedTokenId,
          licenseTermsId: registrationResult.licenseTermsId
            ? BigInt(registrationResult.licenseTermsId)
            : undefined,
          contentUrl: storyData.contentUrl,
          explorerUrl: `https://aeneid.storyscan.io/tx/${transactionHash}`,
        },
        metadataUri: metadataUri,
      };

      setPublishResult(unifiedResult);
      console.log(
        "🎉 Unified publishing complete!",
        JSON.stringify(
          unifiedResult,
          (_, v) => (typeof v === "bigint" ? v.toString() : v),
          2,
        ),
      );
      return unifiedResult;
    } catch (error) {
      console.error("❌ Unified registration failed:", error);
      throw error;
    }
  };

  const handleRegistrationProceed = async () => {
    if (!pendingPublishData) return;

    const { storyData, options, bookId, bookMetadata, isDerivative } =
      pendingPublishData;

    setShowRegistrationFlow(false);
    setCurrentStep("setting-attribution");

    try {
      console.log("📚 Starting book registration process...");

      // Register the book
      const registerResult = await registerBook({
        bookId: bookId!,
        totalChapters: 100,
        isDerivative: isDerivative || false,
        parentBookId:
          isDerivative && bookMetadata?.parentBook
            ? bookMetadata.parentBook
            : undefined,
        ipfsMetadataHash: "",
      });

      if (!registerResult.success) {
        throw new Error(
          `Book registration failed: ${registerResult.error || "Unknown error"}`,
        );
      }

      // Wait a bit for registration to confirm
      console.log("⏳ Waiting for book registration to confirm...");
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Clear pending data and registration flow state
      setPendingPublishData(null);
      setShowRegistrationFlow(false);

      // Now resume the original publishing flow
      console.log("📝 Resuming chapter publishing after book registration...");

      // Call the publish function again - this time it will skip the registration check
      // since the book is now registered
      const publishResult = await publishStoryUnified(
        storyData,
        options,
        bookId,
      );

      // The result will be handled by the original publishing flow
      return publishResult;
    } catch (error) {
      console.error("❌ Registration and publishing failed:", error);
      setCurrentStep("error");
      setPublishResult({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      setPendingPublishData(null);
      setShowRegistrationFlow(false);
    }
  };

  const handleRegistrationCancel = () => {
    setShowRegistrationFlow(false);
    setPendingPublishData(null);
    setCurrentStep("idle");
  };

  const reset = () => {
    setCurrentStep("idle");
    setPublishResult(null);
    setTokenId(null);
    setIPAssetId(null);
    setShowRegistrationFlow(false);
    setPendingPublishData(null);
  };

  const isPublishing =
    currentStep !== "idle" &&
    currentStep !== "success" &&
    currentStep !== "error";

  return {
    publishStory: publishStoryUnified,
    reset,
    isPublishing,
    currentStep,
    publishResult,
    tokenId,
    ipAssetId,
    isUnifiedSupported,
    checkUnifiedSupport,
    showRegistrationFlow,
    pendingPublishData,
    handleRegistrationProceed,
    handleRegistrationCancel,
  };
}
