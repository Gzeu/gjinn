#!/usr/bin/env node

const { program } = require('commander');
const chalk = require('chalk');
const figlet = require('figlet');
const gradient = require('gradient-string');
const boxen = require('boxen');

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

const options = program.opts();

// Handle commands
if (options.generate) {
  console.log(`\n${chalk.blue('🔮 Generating image for:')} ${chalk.yellow(options.generate)}`);
  if (options.style) {
    console.log(`   Style: ${chalk.magenta(options.style)}`);
  }
  console.log(`   Output: ${chalk.cyan(options.output)}`);
  
  // Simulate generation (replace with actual implementation)
  setTimeout(() => {
    console.log('\n' + boxen(
      chalk.green('✨ Image generated successfully!'),
      { padding: 1, borderStyle: 'round', borderColor: 'green' }
    ));
  }, 2000);
} else {
  // Show help if no command is provided
  program.help();
}

// Error handling
process.on('unhandledRejection', (err) => {
  console.error(chalk.red('\n⚠️  An error occurred:'));
  console.error(chalk.red(err.stack || err));
  process.exit(1);
});
