const log4js = require('log4js');
const path = require('path')

log4js.configure({
  appenders: { fe_deploy: { type: 'dateFile', filename: path.join(__dirname, '../../log/fe_deploy.log')} },
  categories: { default: { appenders: ['fe_deploy'], level: 'debug' } }
});

module.exports = log4js.getLogger('fe_deploy');

 