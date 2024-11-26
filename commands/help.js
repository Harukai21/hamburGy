const fs = require('fs');
const path = require('path');

const boldFont = {
  ' ': ' ',
  'a': '𝗮', 'b': '𝗯', 'c': '𝗰', 'd': '𝗱', 'e': '𝗲', 'f': '𝗳', 'g': '𝗴', 'h': '𝗵',
  'i': '𝗶', 'j': '𝗷', 'k': '𝗸', 'l': '𝗹', 'm': '𝗺', 'n': '𝗻', 'o': '𝗼', 'p': '𝗽', 'q': '𝗾',
  'r': '𝗿', 's': '𝘀', 't': '𝘁', 'u': '𝘂', 'v': '𝘃', 'w': '𝘄', 'x': '𝘅', 'y': '𝘆', 'z': '𝘇',
  'A': '𝗔', 'B': '𝗕', 'C': '𝗖', 'D': '𝗗', 'E': '𝗘', 'F': '𝗙', 'G': '𝗚', 'H': '𝗛',
  'I': '𝗜', 'J': '𝗝', 'K': '𝗞', 'L': '𝗟', 'M': '𝗠', 'N': '𝗡', 'O': '𝗢', 'P': '𝗣', 'Q': '𝗤',
  'R': '𝗥', 'S': '𝗦', 'T': '𝗧', 'U': '𝗨', 'V': '𝗩', 'W': '𝗪', 'X': '𝗫', 'Y': '𝗬', 'Z': '𝗭'
};

function toBold(text) {
  return text.split('').map(char => boldFont[char] || char).join('');
}

module.exports = {
  name: 'help',
  description: 'Displays all available commands with pagination',
  usage: '/help [page_number|all]',
  author: 'System',
  execute(senderId, args, pageAccessToken, sendMessage) {
    const commandsDir = path.join(__dirname, '../commands');
    const commandFiles = fs.readdirSync(commandsDir).filter(file => file.endsWith('.js'));

    if (commandFiles.length === 0) {
      return sendMessage(senderId, { text: '⚠️ No commands available at the moment.' }, pageAccessToken);
    }

    const commands = commandFiles.map(file => {
      const command = require(path.join(commandsDir, file));
      return {
        name: command.name,
        description: command.description,
        usage: command.usage,
        formatted: `━━━━━━━━━━━━━━━\n ╰┈➤${toBold(command.name)}\n  ⊂⊃ 𝙸𝚗𝚏𝚘: ${command.description}\n  ⊂⊃ 𝚄𝚜𝚊𝚐𝚎: ${command.usage}\n`
      };
    });

    const commandsPerPage = 5;
    const totalCommands = commands.length;
    const totalPages = Math.ceil(totalCommands / commandsPerPage);

    if (args[0] === 'all') {
      // Show all commands
      const allCommands = commands.map(cmd => cmd.formatted).join('\n\n');
      const helpMessage = `♡   ∩_∩
     („• ֊ •„)♡
┏━━━━━∪∪━━━━━━┓
♡    𝘾𝙊𝙈𝙈𝘼𝙉𝘿𝙎 𝙇𝙄𝙎𝙏    ♡
┗━━━━━━━━━━━━━┛\n\n ➥ᴛᴏᴛᴀʟ ᴄᴏᴍᴍᴀɴᴅꜱ: ${totalCommands}\n\n${allCommands}`;
      return sendMessage(senderId, { text: helpMessage }, pageAccessToken);
    }

    // Handle pagination
    const page = parseInt(args[0], 10) || 1;
    if (page < 1 || page > totalPages) {
      return sendMessage(senderId, { text: `⚠️ Invalid page number. Please choose between 1 and ${totalPages}.` }, pageAccessToken);
    }

    const start = (page - 1) * commandsPerPage;
    const end = start + commandsPerPage;
    const pageCommands = commands.slice(start, end).map(cmd => cmd.formatted).join('\n\n');
    const helpMessage = `♡   ∩_∩
     („• ֊ •„)♡
┏━━━━━∪∪━━━━━━┓
♡    𝘾𝙊𝙈𝙼𝘼𝙉𝘿𝙎 𝙋𝘼𝙂𝙀 ${page}/${totalPages}   ♡
┗━━━━━━━━━━━━━┛\n\n ➥ᴛᴏᴛᴀʟ ᴄᴏᴍᴍᴀɴᴅꜱ: ${totalCommands}\n\n${pageCommands}`;

    sendMessage(senderId, { text: helpMessage }, pageAccessToken);
  }
};
