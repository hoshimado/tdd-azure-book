/*
    [sql_config_grant.js]
	encoding=utf-8
*/



/**
 * @type SQLite接続用の設定変数。
 */
var CONFIG_SQL = {
	// user : process.env.SQL_USER,
	// password : process.env.SQL_PASSWORD,
	// server : process.env.SQL_SERVER, // You can use 'localhost\\instance' to connect to named instance
	database : process.env.SQL_DATABASE_GRANT,
	// stream : false,  // if true, query.promise() is NOT work! // You can enable streaming globally
};
exports.CONFIG_SQL = CONFIG_SQL;


