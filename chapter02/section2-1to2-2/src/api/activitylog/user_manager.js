/**
 * [user_manager.js]
 * 
 * encoding=utf-8
 */

var lib = require("../factory4require.js");
// lib.Factory, Factory4Require としてフック用にラップする
// 関数を定義してある。
var API_PARAM = require("./api_param.js").API_PARAM;
var API_V1_BASE = require("./api_v1_base.js").API_V1_BASE;
var factoryImpl = { // require()を使う代わりに、new Factory() する。
    "sql_parts" : new lib.Factory4Require("./sql_db_io/index.js"),
};
var _SQL_CONNECTION_CONFIG = require("../sql_config.js");
factoryImpl[ "CONFIG_SQL" ] = new lib.Factory(_SQL_CONNECTION_CONFIG.CONFIG_SQL);
factoryImpl[ "MAX_USERS"] = new lib.Factory( _SQL_CONNECTION_CONFIG.MAX_USERS );
factoryImpl[ "MAX_LOGS" ] = new lib.Factory( _SQL_CONNECTION_CONFIG.MAX_LOGS );


// UTデバッグ用のHookポイント。運用では外部公開しないメソッドはこっちにまとめる。
exports.factoryImpl = factoryImpl;

