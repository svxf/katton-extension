function stripComment(line) {
  let inString = false;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"' && line[i - 1] !== '\\') inString = !inString;
    else if (line[i] === '/' && line[i + 1] === '/' && !inString) return line.slice(0, i);
  }
  return line;
}

// rep all string with `""`
function blankStrings(code) {
  return code.replace(/"(?:[^"\\]|\\.)*"/g, '""');
}

function stripLine(line) {
  return blankStrings(stripComment(line));
}

function findClosingParen(text, openIndex) {
  let depth = 0;
  for (let i = openIndex; i < text.length; i++) {
    if (text[i] === '(') depth++;
    else if (text[i] === ')' && --depth === 0) return i;
  }
  return -1;
}

//given text where `text[dotIndex]` is a '.'
function receiverBefore(text, dotIndex) {
  let start = dotIndex;


  while (start > 0) {
    const ch = text[start - 1];

    if (/[\w.]/.test(ch)) {
      start--;
    } else if (ch === ')') {
      let depth = 0;
      let i = start - 1;

      for (; i >= 0; i--) {
        if (text[i] === ')')
          depth++;
        else if (text[i] === '(' && --depth === 0)
          break;
      }


      
      if (i < 0)
        break;
      start = i;
    } else {
      break;
    }
  }
  const chain = text.slice(start, dotIndex);
  return /^[A-Za-z_]/.test(chain) ? chain : null;
}

module.exports = { stripComment, blankStrings, stripLine, findClosingParen, receiverBefore };
