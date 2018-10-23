/*
    [sql_lite_db_test_actual.js]

    encoding=utf-8
*/

var chai = require("chai");
var assert = chai.assert;
var expect = chai.expect;
var sinon = require("sinon");
var shouldFulfilled = require("promise-test-helper").shouldFulfilled;
var shouldRejected  = require("promise-test-helper").shouldRejected;
require('date-utils');
var ApiCommon_StubAndHooker = require("../support_stubhooker.js").ApiCommon_StubAndHooker;
var fs = require("fs");

const sql_parts = require("../../src/api/sql_db_io/index.js");

var TEST_CONFIG_SQL = { // テスト用
	user : "fake_user",
	password : "fake_password",
	server : "fake_server_url", // You can use 'localhost\\instance' to connect to named instance
	database : "./db/mydb.splite3",  //"fake_db_name",
	stream : false,  // if true, query.promise() is NOT work! // You can enable streaming globally

	// Use this if you're on Windows Azure
	options : {
		encrypt : true 
	} // It works well on LOCAL SQL Server if this option is set.
};



// var createPromiseForSqlConnection = function( sqlConfig ){
// var isOwnerValid = function( databaseName, deviceKey ){
// exports.closeConnection = closeConnection;

describe( "sql_lite_db_test_actual.js", function(){
    var createPromiseForSqlConnection = sql_parts.createPromiseForSqlConnection;
    var isOwnerValid = sql_parts.isOwnerValid;
    var closeConnection = sql_parts.closeConnection;
    var addActivityLog2Database = sql_parts.addActivityLog2Database;
    var getListOfActivityLogWhereDeviceKey = sql_parts.getListOfActivityLogWhereDeviceKey;
    var deleteActivityLogWhereDeviceKey = sql_parts.deleteActivityLogWhereDeviceKey;
    var addNewUser = sql_parts.addNewUser;
    var getNumberOfUsers = sql_parts.getNumberOfUsers;
    var deleteExistUser = sql_parts.deleteExistUser;


    describe("::SQLiteトライアル　in メモリーデーターベース。", function(){
        var sqlConfig = { "database" : ":memory:" }; // テスト用なので、インメモリーで動作させる（永続化しない）
        // http://www.sqlitetutorial.net/sqlite-nodejs/connect/

        it.skip("実際の入出力を伴うシークエンスの調査用。createからadd～Deleteまで実施。", function(){
            var promise;
            var tableRow;
            this.timeout(5000);

            // テスト用としてSQLiteデータベースのインスタンスを生成。
            promise = createPromiseForSqlConnection( sqlConfig );

            // テスト用のデータベースにテーブルx2を生成。
            promise = promise.then( function(){
                return sql_parts.setupTable1st( sqlConfig.database );
            }).then(function (rows) {
                console.log("------");
                console.log("> select * from sqlite_master;");
                console.log(rows);
                tableRow = rows; // 最後にココだけ検証する。
            });

            promise = promise.then( function(){
                return addNewUser( sqlConfig.database, "nyan1nyan2nyan3nayn4nayn5nyan6ny", 1024, "password" );
            }).then(function () {
                console.log("------");
                console.log("> addNewUser()");
                console.log("[No return]");
            });

            // ユーザー登録数を取得⇒この時点では1が期待。
            promise = promise.then( function(){
                return getNumberOfUsers( sqlConfig.database );
            }).then(function (users) {
                console.log("------");
                console.log("> getNumberOfUsers()");
                console.log(users);
            });

            promise = promise.then(function(){
                return isOwnerValid( sqlConfig.database, "nyan1nyan2nyan3nayn4nayn5nyan6ny", "password" );
            }).then(function( maxCount ){
                console.log("------");
                console.log("> isOwnerValid()");
				console.log( "[maxCount]=" + maxCount );
                // expect( maxCount, "記録エントリーの最大個数を返却すること" ).to.be.exist;
            });

            promise = promise.then( function(){
                return deleteExistUser( sqlConfig.database, "nyan1nyan2nyan3nayn4nayn5nyan6ny" );
            }).then(function () {
                console.log("------");
                console.log("> deleteExistUser()");
                console.log("[No return]");
            });

            promise = promise.then( function(){
                return getNumberOfUsers( sqlConfig.database );
            }).then(function (users) {
                console.log("------");
                console.log("> getNumberOfUsers()");
                console.log(users);
            });

            promise = promise.then( function(){
                return addActivityLog2Database( sqlConfig.database, "nyan1nyan2nyan3nayn4nayn5nyan6ny", 90 );
            }).then(function () {
                console.log("------");
                console.log("> addActivityLog2Database()");
                console.log("[No return]");
            });

            promise = promise.then( function(result){
                return getListOfActivityLogWhereDeviceKey( sqlConfig.database, "nyan1nyan2nyan3nayn4nayn5nyan6ny", null );
            }).then(function (list) {
                console.log("------");
                console.log("> getListOfActivityLogWhereDeviceKey()");
                console.log(list);
            });

            promise = promise.then( function(){
                return deleteActivityLogWhereDeviceKey( sqlConfig.database, "nyan1nyan2nyan3nayn4nayn5nyan6ny", null );
            }).then(function () {
                console.log("------");
                console.log("> deleteActivityLogWhereDeviceKey()");
                console.log("[No return]");
            });

            promise = promise.then( function(result){
                return getListOfActivityLogWhereDeviceKey( sqlConfig.database, "nyan1nyan2nyan3nayn4nayn5nyan6ny", null );
            }).then(function (list) {
                console.log("------");
                console.log("> getListOfActivityLogWhereDeviceKey()");
                console.log(list);
            });

            promise = promise.then( function(){
                return closeConnection( sqlConfig.database );
            }).then(function () {
                console.log("------");
                console.log("> closeConnection()");
                console.log("[No return]");
            });

            return shouldFulfilled(
                promise
			).then(function () {
                expect(tableRow).to.deep.equal([
                    { type: 'table',
                        name: 'activitylogs',
                        tbl_name: 'activitylogs',
                        rootpage: 2,
                        sql: 'CREATE TABLE activitylogs([id] [integer] PRIMARY KEY AUTOINCREMENT NOT NULL, [created_at] [datetime] NOT NULL, [type] [int] NULL, [owners_hash] [char](64) NULL )' },
                    { type: 'table',
                        name: 'sqlite_sequence',
                        tbl_name: 'sqlite_sequence',
                        rootpage: 3,
                        sql: 'CREATE TABLE sqlite_sequence(name,seq)' },
                    { type: 'table',
                        name: 'owners_permission',
                        tbl_name: 'owners_permission',
                        rootpage: 4,
                        sql: 'CREATE TABLE owners_permission([id] [integer] PRIMARY KEY AUTOINCREMENT NOT NULL, [owners_hash] [char](64) NOT NULL, [password] [char](16) NULL, [max_entrys] [int] NOT NULL, UNIQUE ([owners_hash]) )' },
                    { type: 'index',
                        name: 'sqlite_autoindex_owners_permission_1',
                        tbl_name: 'owners_permission',
                        rootpage: 5,
                        sql: null } 
                ]);
            });
		});
	});
});



