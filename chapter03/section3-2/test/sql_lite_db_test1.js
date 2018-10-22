/*
    [sql_lite_db_test.js]

    encoding=utf-8
*/

var chai = require("chai");
var assert = chai.assert;
var expect = chai.expect;
var sinon = require("sinon");
var shouldFulfilled = require("promise-test-helper").shouldFulfilled;
var shouldRejected  = require("promise-test-helper").shouldRejected;
require('date-utils');

var sql_parts = require("../src/sql_lite_db.js");


describe( "sql_lite_db_test.js", function(){
    var createPromiseForSqlConnection = sql_parts.createPromiseForSqlConnection;
    var closeConnection = sql_parts.closeConnection;
    var addActivityLog2Database = sql_parts.addActivityLog2Database;
    var getListOfActivityLogWhereDeviceKey = sql_parts.getListOfActivityLogWhereDeviceKey;

    /**
     * @type 各テストからはアクセス（ReadOnly）しない定数扱いの共通変数。
     */
    var ORIGINAL = {};
    var sqlConfig = { "database" : "だみ～.sqlite3" };
    var stubInstance, databaseArgs1;
    before( function(){
        var stubSqlite3 = { 
            "verbose" : sinon.stub() 
        };
        stubInstance = { "sqlite3" : "fake"}; // newで返すオブジェクトのモック。
        databaseArgs1 = "";

        // sqlite3モジュールに対するI/Oをモックに差し替える。
        stubSqlite3.verbose.onCall(0).returns({
            "Database" : function( databaseName, callback ){
                // newされた時のコンスタラクタ処理に相当。
                // returnすることで差替えることが出来る。
                setTimeout(function() {
                    callback(); // 非同期で呼ばれる、、、を疑似的に行う。
                }, 100);
                databaseArgs1 = databaseName;
                return stubInstance;
            }
        });
        ORIGINAL[ "sqlite3" ] = sql_parts.factoryImpl.sqlite3.getInstance();
        ORIGINAL[ "dbs" ] = sql_parts.factoryImpl.db.getInstance();
        sql_parts.factoryImpl.sqlite3.setStub( stubSqlite3 );
    });
    after( function(){
        sql_parts.factoryImpl.sqlite3.setStub( ORIGINAL.sqlite3 );
        sql_parts.factoryImpl.db.setStub( ORIGINAL.dbs );
    });

    describe( "::getListOfActivityLogWhereDeviceKey()",function(){
        it("正常系。期間指定なし。",function(){
            var period = null; //無しの場合
            var deviceKey = "にゃーん。";

            // アクセス前処理
            var dbs = sql_parts.factoryImpl.db.getInstance();
            var stub_instance = sinon.stub();
            var expected_rows = [
                { 
                    "created_at": '2017-10-22 23:59:00.000', 
                    "type": 900 
                }
            ];
            dbs[ sqlConfig.database ] = {
                "all" : stub_instance
            }; // http://www.sqlitetutorial.net/sqlite-nodejs/query/
            stub_instance.callsArgWith(2, /* err= */ null, /* rows= */ expected_rows);

            // 被テスト関数の実行
            return shouldFulfilled(
                sql_parts.getListOfActivityLogWhereDeviceKey( sqlConfig.database, deviceKey, period )
            ).then(function(result){
                // アクセス後処理：不要

                // 実行結果の検証
                assert( stub_instance.calledOnce );
                var called_args = stub_instance.getCall(0).args;
                expect( called_args[0] ).to.equal(
                    "SELECT created_at, type FROM activitylogs " 
                    + "WHERE [owners_hash] = ?"
                );
                expect( called_args[1] ).to.deep.equal(
                    [deviceKey]
                );
                expect( result ).to.deep.equal( expected_rows );
            });
        });
    });
});



