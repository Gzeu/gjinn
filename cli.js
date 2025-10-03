#!/usr/bin/env node
'use strict';

const { program } = require('commander');
const chalk = require('chalk').default;
const figlet = require('figlet');
const gradient = require('gradient-string');
const boxen = require('boxen').default;
const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const { Readable } = require('stream');
const { promisify } = require('util');
const pipeline = promisify(require('stream').pipeline);

// Display fancy header
console.log(
  gradient.morning.multiline(
    figlet.textSync('Gjinn AI', { horizontalLayout: 'full' })
  )
);

// Initialize CLI
program
  .version(require('./package.json').version)
  .description('Gjinn AI - Transform your creative ideas into AI-generated images')
  .option('-g, --generate <prompt>', 'Generate an image from a text prompt')
  .option('-s, --style <style>', 'Specify an art style (e.g., digital art, watercolor, pixel art)')
  .option('-o, --output <path>', 'Specify output directory', './output')
  .option('-v, --verbose', 'Enable verbose output')
  .parse(process.argv);

// Get the parsed options
const options = program.opts();

// Main async function
(async () => {
  // Handle commands
  if (options.generate) {
  console.log(chalk.blue('\n🔮 Generating image for:') + ' ' + chalk.yellow(options.generate));
  if (options.style) {
    console.log('   Style: ' + chalk.magenta(options.style));
  }
  console.log('   Output: ' + chalk.cyan(options.output));
  
    try {
      // Create output directory if it doesn't exist
      if (!fs.existsSync(options.output)) {
        fs.mkdirSync(options.output, { recursive: true });
      }
    
    // Generate output file path
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    let outputFile = path.join(options.output, `gjinn_${timestamp}.png`);
    
    // Show loading message
    console.log(chalk.blue('\n🔄 Generating AI image with Pollinations API...'));
    
    // Generate image using Pollinations API
    const prompt = options.generate;
    const style = options.style || 'digital art';
    const fullPrompt = `${prompt}, ${style} style, high quality, detailed, 4k`;
    
    // Call the Pollinations API
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(fullPrompt)}`;
    
    // Download the image
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to generate image: ${response.statusText}`);
    }
    
    // Save the image to a file
    const fileStream = fs.createWriteStream(outputFile);
    await pipeline(response.body, fileStream);
    
    console.log('\n' + boxen(
      `${chalk.green('✨ Image generation complete!')}\n` +
      `${chalk.blue('Saved to:')} ${chalk.yellow(outputFile)}\n` +
      `${chalk.blue('Prompt:')} ${chalk.yellow(options.generate)}\n` +
      `${chalk.blue('Style:')} ${chalk.magenta(options.style || 'default')}`,
      { 
        padding: 1, 
        borderStyle: 'round', 
        borderColor: 'green',
        margin: 1,
        textAlignment: 'center'
      }
    ));
  } catch (error) {
    console.error(chalk.red('\n⚠️  Error generating image:'));
    console.error(chalk.red(error.message));
    
    // Fallback to canvas if API fails
    console.log(chalk.yellow('\n⚠️  Falling back to simple text image...'));
    
    try {
      // Generate a new output file for the fallback
      const fallbackTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
      outputFile = path.join(options.output, `gjinn_fallback_${fallbackTimestamp}.png`);
        const canvas = createCanvas(800, 600);
        const ctx = canvas.getContext('2d');
        
        // Draw background
        const gradient = ctx.createLinearGradient(0, 0, 800, 600);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#16213e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 800, 600);
        
        // Add text
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Draw title
        ctx.font = 'bold 40px Arial';
        ctx.fillText('Gjinn AI', 400, 100);
        
        // Draw error message
        ctx.font = '24px Arial';
        wrapText(ctx, 'Failed to generate AI image', 400, 250, 700, 32);
        wrapText(ctx, 'Error: ' + error.message, 400, 300, 700, 32);
        wrapText(ctx, 'Prompt: ' + options.generate, 400, 350, 700, 32);
        
        // Save the fallback image
        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(outputFile, buffer);
        
        console.log(chalk.yellow(`\n✅ Saved fallback image to: ${outputFile}`));
      } catch (fallbackError) {
        console.error(chalk.red('\n⚠️  Error creating fallback image:'));
        console.error(chalk.red(fallbackError.message));
      }
      
      process.exit(1);
    }
  } else {
    // Show help if no command is provided
    program.help();
  }
})();

// Helper function to wrap text
function wrapText(context, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let testLine = '';
  let lineCount = 0;
  
  for (let n = 0; n < words.length; n++) {
    testLine = line + words[n] + ' ';
    const metrics = context.measureText(testLine);
    const testWidth = metrics.width;
    
    if (testWidth > maxWidth && n > 0) {
      context.fillText(line, x, y + (lineCount * lineHeight));
      line = words[n] + ' ';
      lineCount++;
    } else {
      line = testLine;
    }
  }
  
  context.fillText(line, x, y + (lineCount * lineHeight));
}

// Error handling
process.on('unhandledRejection', (err) => {
  console.error(chalk.red('\n⚠️  An error occurred:'));
  console.error(chalk.red(err.stack || err));
  process.exit(1);
});
