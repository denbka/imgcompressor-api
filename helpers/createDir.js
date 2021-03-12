const fs = require('fs')

module.exports = (dirName) => {
    if (!fs.existsSync(dirName)) {
        fs.mkdirSync(dirName)
    }
}
  