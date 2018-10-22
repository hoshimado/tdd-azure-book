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

    describe( "::addActivityLog2Database()", function () {
        var addActivityLog2Database = sql_parts.addActivityLog2Database;
        it("正常系：時刻指定はさせない仕様（内部時間を利用する）", function () {
            var deviceKey = "にゃーん。";
            var typeOfAction = "111";
            var dbs = sql_parts.factoryImpl.db.getInstance();
            var stub_instance = sinon.stub();
            var stub_wrapperStr = sinon.stub().callsFake( function(str){ return str; } );
            var clock = sinon.useFakeTimers(); // これで時間が止まる。「1970-01-01 09:00:00.000」に固定される。
            
            dbs[ sqlConfig.database ] = {
                "run" : stub_instance
            }; // http://www.sqlitetutorial.net/sqlite-nodejs/insert/
            stub_instance.callsArgWith(2, /* err= */null);
            sql_parts.factoryImpl._wrapStringValue.setStub( stub_wrapperStr );

            return shouldFulfilled(
                addActivityLog2Database( sqlConfig.database, deviceKey, typeOfAction )
            ).then(function(result){
                clock.restore(); // 時間停止解除。

                assert( stub_wrapperStr.withArgs( deviceKey ).calledOnce );
                assert( stub_instance.calledOnce );

                var called_args = stub_instance.getCall(0).args;
                expect( called_args[0] ).to.equal(
                    "INSERT INTO activitylogs(created_at, type, owners_hash ) " 
                    + "VALUES( ?, ?, ? )"
                );
                expect( called_args[1] ).to.deep.equal([
                    '1970-01-01 09:00:00.000',
                    typeOfAction,
                    deviceKey
                ]);
                expect( result ).to.deep.equal({
                    "type_value" : typeOfAction,
                    "device_key" : deviceKey
                });
            });
        });
    });
});



