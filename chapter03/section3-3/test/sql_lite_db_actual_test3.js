/*
    [sql_lite_db_actual_test2.js]

    encoding=utf-8
*/

var shouldFulfilled = require("promise-test-helper").shouldFulfilled;
var shouldRejected  = require("promise-test-helper").shouldRejected;
require('date-utils');

const sql_parts = require("../src/sql_lite_db.js");


describe( "sql_lite_db_actual_test3.js", function(){
    var createPromiseForSqlConnection = sql_parts.createPromiseForSqlConnection;
    var closeConnection = sql_parts.closeConnection;

    var addNewUser = sql_parts.addNewUser;

    describe("【実際にアクセス】::addNewUser()", function(){
		it("ユーザー追加。初回は成功。2回目からは「既存ユーザー」で失敗", function(){
            var sqlConfig = { "database" : "./db/mydb.sqlite3" }; // npm test 実行フォルダ、からの相対パス
            var promise;

            this.timeout(5000);

            promise = createPromiseForSqlConnection( sqlConfig );
            promise = promise.then( function(){
                return addNewUser( sqlConfig.database, "nyan1nyan2nyan3nayn4nayn5nyan6ny", 16, "cat-password" ) 
            });

            return shouldFulfilled(
                promise
			).then(function( result ){
                console.log( result );
                closeConnection( sqlConfig.database );
			});
		});
	});
});

