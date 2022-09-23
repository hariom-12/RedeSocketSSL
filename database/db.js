const mysql      = require('mysql');
const connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'password',
  database : 'rede'
});
 
connection.connect((err) => {
    if (err) {
      console.error('error connecting: ' + err.stack);
      return;
    }
});

module.exports = connection;
