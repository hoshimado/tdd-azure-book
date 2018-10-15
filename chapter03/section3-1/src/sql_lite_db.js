/**
 * [sql_lite_db.js]
 * 
 *  encoding=utf-8
 */

require('date-utils'); // Data() クラスのtoString()を拡張してくれる。
var lib = require("./factory4require.js");
var factoryImpl = { // require()を使う代わりに、new Factory() する。
	"sqlite3" : new lib.Factory4Require("sqlite3"),  // https://www.npmjs.com/package/mssql
	"db" : new lib.Factory( {} ) // データベースごとにハッシュマップで持つ。
};

// UTデバッグ用のHookポイント。運用では外部公開しないメソッドはこっちにまとめる。
exports.factoryImpl = factoryImpl;



// 後でのハッシュ化に備えたラッパー
var _wrapStringValue = function( deviceKey ){
	return deviceKey;
};
factoryImpl[ "_wrapStringValue" ] = new lib.Factory( _wrapStringValue );



/**
 * ※SQL接続を生成。
 * 
 * @param{Object} sqlConfig     SQL接続情報。
 */
var createPromiseForSqlConnection = function( sqlConfig ){
	var dbs = factoryImpl.db.getInstance();
	var databaseName = sqlConfig.database;

	if( dbs[ databaseName ] ){
		return Promise.resolve()
	}else{
		return new Promise(function(resolve,reject){
			var sqlite = factoryImpl.sqlite3.getInstance().verbose();
			var db_connect = new sqlite.Database( databaseName, (err) =>{
				if( !err ){
					dbs[ databaseName ] = db_connect;
					resolve();
				}else{
					reject(err);
				}
			});
		})
	}
};
exports.createPromiseForSqlConnection = createPromiseForSqlConnection;


var closeConnection = function( databaseName ){
	var dbs = factoryImpl.db.getInstance();
	var db = dbs[ databaseName ];
	if( !db ){
		return Promise.reject({
			"isReady" : false
		});
	}

	return new Promise(function(resolve,reject){
		db.close((err)=>{
			if(!err){
				dbs[ databaseName ] = null;
				resolve();
			}else{
				reject(err)
			}
		});
	});
};
exports.closeConnection = closeConnection;


/**
 * デバイスキーを識別子として、ユーザーアクションをデータベースに記録する。
 * 記録する時刻は「これが呼ばれた時刻」とする。
 * @param{String} databaseName データベース名
 * @param{String} deviceKey デバイスの識別キー
 * @param{Number} typeOfAction 記録するアクション（定数値）
 * @returns{Promise} 実行結果を返すPromiseオブジェクト。成功時は、記録されたデバイス名とアクション値が返却される。
 */
var addActivityLog2Database = function( databaseName, deviceKey, typeOfAction ){
	var wrapString = factoryImpl._wrapStringValue.getInstance(); 
	var dbs = factoryImpl.db.getInstance();
	var db = dbs[ databaseName ];
	if( !db ){
		return Promise.reject({
			"isReady" : false
		});
	}

	return new Promise(function(resolve,reject){
		var now_date = new Date();
		var date_str = now_date.toFormat("YYYY-MM-DD HH24:MI:SS.000"); // data-utilsモジュールでの拡張を利用。
		var key = wrapString(deviceKey);
		var query_str = "INSERT INTO activitylogs(created_at, type, owners_hash ) ";
		query_str += "VALUES( ?, ?, ? )";

		db.run(query_str, [date_str, typeOfAction, key], (err) => {
			if(!err){
				var insertedData = {
					"type_value" : typeOfAction,
					"device_key" : deviceKey
				};
				resolve( insertedData );
			}else{
				reject({
					"isEnableValidationProcedure" : false
				});
			}
		});
	});
};
exports.addActivityLog2Database = addActivityLog2Database;




/**
 * デバイス識別キーに紐づいたログを、指定されたデータベースから取得する。
 * @param{String} Database データベース名
 * @param{String} deviceKey デバイスの識別キー
 * @param{Object} period 取得する日付の期間 { start : null, end : null }を許容する。ただし、使う場合はyyyy-mm-dd整形済みを前提。
 * @returns{Promise} SQLからの取得結果を返すPromiseオブジェクト。成功時resolve( rows ) 、失敗時reject( err )。
 */
var getListOfActivityLogWhereDeviceKey = function( databaseName, deviceKey, period ){
	var wrapString = factoryImpl._wrapStringValue.getInstance(); 
	var dbs = factoryImpl.db.getInstance();
	var db = dbs[ databaseName ];
	if( !db ){
		return Promise.reject({
			"isReady" : false
		});
	}

	var key = wrapString(deviceKey);
	var query_str = "SELECT created_at, type FROM activitylogs";
	query_str += " WHERE [owners_hash] = ?";

	return new Promise(function(resolve,reject){
		db.all(query_str, [key], (err, rows) => {
			if(!err){
				return resolve( rows );
			}else{
				return reject( err );
			}
		});
	});
};
exports.getListOfActivityLogWhereDeviceKey = getListOfActivityLogWhereDeviceKey;



/**
 * ユーザーを、テーブルに登録する。
 * 
 * @param{String} databaseName データベース名
 * @param{String} deviceKey アクセスデバイスごとの一意の識別子（※ハッシュにしようか？）
 * @param{Number} maxEntrys ユーザー事（デバイス事）の可能な最大登録数。
 * @param{String} password ユーザーごとのパスワード（無しも可とする？）
 * @returns{Promise} 登録結果。Promise経由で非同期に返る。resolve()は登録内容。reject()はエラー内容が引数に入る。
 */
var addNewUser = function(databaseName, deviceKey, maxEntrys, passwordStr ){
	var dbs = factoryImpl.db.getInstance();
	var db = dbs[ databaseName ];
	if( !db ){
		return Promise.reject({
			"isReady" : false
		});
	}

	return new Promise(function(resolve,reject){
		var wrapString = factoryImpl._wrapStringValue.getInstance(); 
		var wrappedDeviceKey = wrapString( deviceKey );
		var wrappedPassWord = wrapString( passwordStr )
		var query_str = "INSERT INTO owners_permission([owners_hash], [max_entrys], [password])";
		query_str += " VALUES( ?, ?, ? )";

		db.run(query_str, [wrappedDeviceKey, maxEntrys, wrappedPassWord], (err) => {
			if(!err){
				return resolve();
			}else{
				// なお、重複キーの時のerr内容は以下。
				// "Error: SQLITE_CONSTRAINT: UNIQUE constraint failed: owners_permission.owners_hash"
				reject({
					"cant_to_insert" : err
				});
			}
		});
	});
};
exports.addNewUser = addNewUser;