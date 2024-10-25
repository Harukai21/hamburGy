const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'help',
  description: 'Displays all available commands',
  usage: '/help',
  author: 'System',
  execute(senderId, args, pageAccessToken, sendMessage) {
    const commandsDir = path.join(__dirname, '../commands');
    const commandFiles = fs.readdirSync(commandsDir).filter(file => file.endsWith('.js'));

    if (commandFiles.length === 0) {
      return sendMessage(senderId, { text: '⚠️ No commands available at the moment.' }, pageAccessToken);
    }

    const commands = commandFiles.map(file => {
      const command = require(path.join(commandsDir, file));
      return `╰┈➤📄${command.name}\n  ⊂⊃ Info: ${command.description}\n  ⊂⊃ Usage: ${command.usage}`;
    });

    const totalCommands = commandFiles.length;
    const helpMessage = `♡   ∩_∩
     („• ֊ •„)♡
┏━━━━━∪∪━━━━━━┓
♡     COMMANDS LIST            ♡
┗━━━━━━━━━━━━━┛\n\n ⊂⊃ ➥Total commands: ${totalCommands}\n\n${commands.join('\n\n')}`;

    sendMessage(senderId, { text: helpMessage }, pageAccessToken);
  }
};
