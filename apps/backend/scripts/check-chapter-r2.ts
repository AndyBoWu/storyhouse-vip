import { R2Service } from '../lib/r2'

async function checkChapterInR2() {
  const authorAddress = '0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2'
  const bookSlug = 'project-phoenix'
  const chapterNumber = 4
  
  // Define the paths to check
  const contentPath = `books/${authorAddress}/${bookSlug}/chapters/ch${chapterNumber}/content.json`
  const metadataPath = `books/${authorAddress}/${bookSlug}/chapters/ch${chapterNumber}/.metadata.json`
  
  console.log('🔍 Checking for chapter 4 of "project-phoenix"...')
  console.log(`Author: ${authorAddress}`)
  console.log(`Book: ${bookSlug}`)
  console.log(`Chapter: ${chapterNumber}`)
  console.log('---')
  
  // Check content file
  console.log(`\n📄 Checking content file: ${contentPath}`)
  try {
    const content = await R2Service.getContent(contentPath)
    console.log('✅ Content file exists!')
    console.log(`Size: ${content.length} characters`)
    
    // Try to parse and display some info
    try {
      const parsed = JSON.parse(content)
      console.log('Content details:')
      console.log(`  - Title: ${parsed.title || 'N/A'}`)
      console.log(`  - Content length: ${parsed.content?.length || 0} characters`)
      console.log(`  - Created: ${parsed.createdAt || 'N/A'}`)
    } catch (parseError) {
      console.log('(Could not parse content as JSON)')
    }
  } catch (error) {
    console.log('❌ Content file NOT found')
    console.log(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
  
  // Check metadata file
  console.log(`\n📋 Checking metadata file: ${metadataPath}`)
  try {
    const metadata = await R2Service.getContent(metadataPath)
    console.log('✅ Metadata file exists!')
    console.log(`Size: ${metadata.length} characters`)
    
    // Try to parse and display some info
    try {
      const parsed = JSON.parse(metadata)
      console.log('Metadata details:')
      console.log(`  - IP Asset ID: ${parsed.ipAssetId || 'N/A'}`)
      console.log(`  - License Terms ID: ${parsed.licenseTermsId || 'N/A'}`)
      console.log(`  - Created: ${parsed.createdAt || 'N/A'}`)
      console.log(`  - SHA-256 Hash: ${parsed.sha256Hash || 'N/A'}`)
    } catch (parseError) {
      console.log('(Could not parse metadata as JSON)')
    }
  } catch (error) {
    console.log('❌ Metadata file NOT found')
    console.log(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
  
  // Also check for enhanced content with license metadata
  console.log(`\n🏷️ Checking for enhanced metadata...`)
  try {
    const enhanced = await R2Service.getEnhancedContent(contentPath)
    if (enhanced.licenseInfo) {
      console.log('✅ Enhanced license metadata found:')
      console.log(`  - License tier: ${enhanced.licenseInfo.tier}`)
      console.log(`  - TIP price: ${enhanced.licenseInfo.tipPrice}`)
      console.log(`  - Commercial use: ${enhanced.licenseInfo.commercialUse}`)
    } else {
      console.log('ℹ️ No enhanced license metadata in content')
    }
  } catch (error) {
    console.log('Could not check enhanced metadata')
  }
}

// Run the check
checkChapterInR2().catch(console.error)