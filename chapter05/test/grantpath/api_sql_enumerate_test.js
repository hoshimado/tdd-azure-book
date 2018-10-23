/* eslint-env mocha */
/*
	[api_sql_enumerate_test.js]

	encoding=utf-8
*/

var chai = require("chai");
var assert = chai.assert;
var expect = chai.expect;
var sinon = require("sinon");
var shouldFulfilled = require("promise-test-helper").shouldFulfilled;
var shouldRejected  = require("promise-test-helper").shouldRejected;
var hookProperty = require("hook-test-helper").hookProperty;
require("date-utils");


const api_enumerate = require("../../src/api/grantpath/api_sql_enumerate.js");

var TEST_CONFIG_SQL = { // テスト用
	user : "fake_user",
	password : "fake_password",
	server : "fake_server_url", // You can use 'localhost\\instance' to connect to named instance
	database : "fake_db_name",
	stream : false,  // if true, query.promise() is NOT work! // You can enable streaming globally

	// Use this if you're on Windows Azure
	options : {
		encrypt : true 
	} // It works well on LOCAL SQL Server if this option is set.
};



describe( "api_sql_enumerate.js", function(){
    describe("::api_v1_serialpath_grant() - actual", function(){
        var sql_parts_actual = require("../../src/api/sql_db_io/index.js");
        var TEMP_VIRTIAL_CONFIG = {
            "database" : ":memory:"
        };
        var hooked = {};

        beforeEach(function () {
            hooked["SQL_CONFIG"] = hookProperty( api_enumerate.SQL_CONFIG, TEMP_VIRTIAL_CONFIG );
        });
        afterEach(function(){
            hooked["SQL_CONFIG"].restore();
        });

        it("実際のデータベースに対してパス取得と回数アップデートができること",function () {
            var SERIAL_NUMBER = "nayn1nyan2nyan3";
            var URL = "granted-pash/hoge.pdf";
            var CREATE_TABLE = "CREATE TABLE [redirect_serial]([id] [integer] PRIMARY KEY AUTOINCREMENT NOT NULL, [serial] [text] NOT NULL, [max_entrys] [int] NOT NULL, [called] [int] NOT NULL, [url] [text] NULL )";
            var INSERT_QUERY = "INSERT INTO [redirect_serial](serial, max_entrys, called, url) VALUES('" + SERIAL_NUMBER + "', 32, 0, '" + URL + "')";

            return sql_parts_actual.createPromiseForSqlConnection(
                TEMP_VIRTIAL_CONFIG
            ).then(function() {
                return sql_parts_actual.queryDirectly( TEMP_VIRTIAL_CONFIG.database, CREATE_TABLE, [] );
            }).then(function() {
                return sql_parts_actual.queryDirectly( TEMP_VIRTIAL_CONFIG.database, INSERT_QUERY, [] );
            }).then(function() {
                return sql_parts_actual.queryDirectly( TEMP_VIRTIAL_CONFIG.database, "SELECT * from [redirect_serial]", [] );
            }).then(function (rows) {
                expect(rows).to.deep.equal([{
                    "id": 1,
                    "serial": SERIAL_NUMBER,
                    "max_entrys": 32,
                    "called": 0,
                    "url": URL 
                }]);
            }).then(function() {
                return api_enumerate.api_v1_serialpath_grant( null, {"serial" : SERIAL_NUMBER} );
                // ↑上記で、closeConnection()が呼ばれているので、ここでメモリーデータベースは揮発する。
            }).then(function(result) {
                expect(result).has.property("jsonData").to.deep.equal({
                    "path" : URL,
                    "left" : 31
                });
            });
        });
    });

    describe("::api_v1_serialpath_grant()", function(){
        var stubs, hooked = {};
        var api_v1_serialpath_grant = api_enumerate.api_v1_serialpath_grant;
        var createSqlPartStub = function () {
            return {
              "createPromiseForSqlConnection" : sinon.stub(),
              "closeConnection" : sinon.stub()
            };
        };
        var createLocalMethodStub = function(){
            return {
                "grantPathFromSerialNumber" : sinon.stub(),
                "updateCalledWithTargetSerial" : sinon.stub()
            };
        };
        beforeEach(function(){ // 内部関数をフックする。
            stubs = {};

            stubs["sql_parts"] = createSqlPartStub();
            hooked["sql_parts"] = hookProperty( api_enumerate.sql_parts, stubs["sql_parts"] );

            stubs["hook"] = createLocalMethodStub();
            hooked["hook"] = hookProperty( api_enumerate.hook, stubs["hook"] );

            hooked["SQL_CONFIG"] = hookProperty( api_enumerate.SQL_CONFIG, TEST_CONFIG_SQL );
        });
        afterEach(function(){
            hooked["sql_parts"].restore();
            hooked["hook"].restore();
            hooked["SQL_CONFIG"].restore();
        });

        it("grants the given serial-key based on database.", function(){
            var DUMMY_SERIAL = "123456";
            var DUMMY_CURRENT_COUNT = 16, DUMMY_MAX_COUNT = 32;
            var DUMMY_PATH = "hogehoge", LEFT_COUNT = DUMMY_MAX_COUNT - (DUMMY_CURRENT_COUNT + 1);
            var queryFromGet = null, dataFromPost = { "serial" : DUMMY_SERIAL };

            stubs.sql_parts.createPromiseForSqlConnection.onCall(0).returns(
                Promise.resolve()
            );
            stubs.sql_parts.closeConnection.onCall(0).returns(
                Promise.resolve()
            );
            stubs.hook.grantPathFromSerialNumber.onCall(0).returns(
                Promise.resolve({
                    "called" : DUMMY_CURRENT_COUNT,
                    "max_entrys" : DUMMY_MAX_COUNT,
                    "path" : DUMMY_PATH
                })
            );
            stubs.hook.updateCalledWithTargetSerial.onCall(0).returns(
                Promise.resolve({
                    "path" : DUMMY_PATH,
                    "left" : LEFT_COUNT
                })
            );

            return shouldFulfilled(
                api_v1_serialpath_grant( queryFromGet, dataFromPost )
            ).then(function (result) {
                var open = stubs.sql_parts.createPromiseForSqlConnection;
                var grant = stubs.hook.grantPathFromSerialNumber;
                var update = stubs.hook.updateCalledWithTargetSerial;
                var close = stubs.sql_parts.closeConnection;

                expect(open.callCount).to.equal(1);
                expect(open.getCall(0).args[0]).to.deep.equal(TEST_CONFIG_SQL);

                // calledWith()だと true/falseでしかエラーを取れないので。
                expect(grant.callCount).to.equal(1);
                expect(grant.getCall(0).args[0]).to.equal(TEST_CONFIG_SQL.database);
                expect(grant.getCall(0).args[1]).to.equal(DUMMY_SERIAL);

                expect(update.callCount).to.equal(1);
                expect(update.getCall(0).args[0]).to.equal(TEST_CONFIG_SQL.database);
                expect(update.getCall(0).args[1]).to.equal(DUMMY_SERIAL);
                expect(update.getCall(0).args[2]).to.equal(DUMMY_PATH);
                expect(update.getCall(0).args[3]).to.equal(DUMMY_CURRENT_COUNT + 1);
                expect(update.getCall(0).args[4]).to.equal(DUMMY_MAX_COUNT);

                expect(close.callCount).to.equal(1);

                expect(result).to.have.property("jsonData");
                expect(result.jsonData).to.have.property("path").to.equal(DUMMY_PATH);
                expect(result.jsonData).to.have.property("left").to.equal(LEFT_COUNT);
                expect(result).to.have.property("status").to.equal(200);
            });
        });
        it("fail to open Database.");
        it("can't grant the serialK-key.");
        it("can't update the called count.");
        it("fails to close.");
    });
    describe("::local::grantPathFromSerialNumber()", function(){
        var grantPathFromSerialNumber = api_enumerate.hook.grantPathFromSerialNumber;
        var stubs, hooked = {};
        var createSqlPartStub = function () {
            return {
              // "createPromiseForSqlConnection" : sinon.stub(),
              // "closeConnection" : sinon.stub(),
              "queryDirectly" : sinon.stub()
            };
        };
        beforeEach(function(){ // 内部関数をフックする。
            stubs = {};
            stubs["sql_parts"] = createSqlPartStub();
            hooked["sql_parts"] = hookProperty( api_enumerate.sql_parts, stubs["sql_parts"] );
        });
        afterEach(function(){
            hooked["sql_parts"].restore();
        });
        it("get called-count, max-count, and path.",function () {
            var OPENED_DATABASE_NAME = TEST_CONFIG_SQL.database;
            var SERIAL_NUMBER = "key from posted";
            var EXPECTED_URL = "http://hogehoge.piyo";
            var EXPECTED_CALLED_COUNT = "12";
            var EXPECTED_MAX_ENTRYS = "32";
            var EXPECTED_QUERY_RESULT = [
                {
                    "id" : 1,
                    "serial" : SERIAL_NUMBER,
                    "url" : EXPECTED_URL + "    ", // 不要な空白があるもの、とする。
                    "called" : EXPECTED_CALLED_COUNT,
                    "max_entrys" : EXPECTED_MAX_ENTRYS
                }, 
                { "id" : "不要な2つめの要素→無いとは思うが、入れて置く" 
                }
            ];
            var EXPECTED_QUERY_STR = "SELECT [id], [serial], [called], [max_entrys], [url]";
            EXPECTED_QUERY_STR += " FROM [redirect_serial]";
            EXPECTED_QUERY_STR += " WHERE [serial] = ?";
            var EXPECTED_PLACEHOLDER_PARAM = [ SERIAL_NUMBER ];

            // calledWith()でスタブ定義しないのは、検証時に calledOnce()でしか検証できないから。
            // 意図しない引数での呼び出しも、すぐわかる方が望ましい。
            stubs.sql_parts.queryDirectly.onCall(0).returns(
                Promise.resolve( EXPECTED_QUERY_RESULT )
            );        

            return shouldFulfilled(
                grantPathFromSerialNumber(
                    OPENED_DATABASE_NAME, SERIAL_NUMBER
                )
            ).then(function (result) {
                expect(stubs.sql_parts.queryDirectly.callCount).to.equal(1, "queryDirectly()が1度だけ呼ばれること");
                expect(stubs.sql_parts.queryDirectly.getCall(0).args[0]).to.equal(OPENED_DATABASE_NAME);
                expect(stubs.sql_parts.queryDirectly.getCall(0).args[1]).to.equal(EXPECTED_QUERY_STR);
                expect(stubs.sql_parts.queryDirectly.getCall(0).args[2]).to.deep.equal(EXPECTED_PLACEHOLDER_PARAM);

                expect(result).to.have.property("called").to.equal(EXPECTED_CALLED_COUNT);
                expect(result).to.have.property("max_entrys").to.equal(EXPECTED_MAX_ENTRYS);
                expect(result).to.have.property("path").to.equal(EXPECTED_URL); // 空白は除去されるものとする。
            });
         });
         it("failed because of Invalid Serial Key.");
         it("failed because query failed.");
    });
    describe("::local::updateCalledWithTargetSerial()", function(){
        var stubs, hooked = {};
        var updateCalledWithTargetSerial = api_enumerate.hook.updateCalledWithTargetSerial;
        var createSqlPartStub = function () {
            return {
              // "createPromiseForSqlConnection" : sinon.stub(),
              // "closeConnection" : sinon.stub(),
              "queryDirectly" : sinon.stub()
            };
        };
        beforeEach(function(){ // 内部関数をフックする。
            stubs = {};
            stubs["sql_parts"] = createSqlPartStub();
            hooked["sql_parts"] = hookProperty( api_enumerate.sql_parts, stubs["sql_parts"] );
        });
        afterEach(function(){
            hooked["sql_parts"].restore();
        });
        it("update called-count with serial-key and path.", function () {
            var OPENED_DATABASE_NAME = TEST_CONFIG_SQL.database;
            var IN_SERIALKEY = "abc123456789noncase32number16MAX";
            var EXPECTED_PATH = "期待されたパス";
            var EXPECTED_MAX = 16;
            var CURRENT_CALLED_COUNT = 9;

            stubs.sql_parts.queryDirectly.onCall(0).returns(
                Promise.resolve()
            );

            return shouldFulfilled(
                updateCalledWithTargetSerial(
                    OPENED_DATABASE_NAME, 
                    IN_SERIALKEY, 
                    EXPECTED_PATH,
                    CURRENT_CALLED_COUNT, 
                    EXPECTED_MAX)
            ).then(function(result){
                var EXPECTED_QUERY_STR = "UPDATE [redirect_serial]";
                EXPECTED_QUERY_STR += " SET [called] = ?";
                EXPECTED_QUERY_STR += " WHERE [serial] = ? ";
                var EXPECTED_PLACEHOLDER_PARAM = [
                    CURRENT_CALLED_COUNT,
                    IN_SERIALKEY
                ];

                expect(stubs.sql_parts.queryDirectly.callCount).to.equal(1);
                var args = stubs.sql_parts.queryDirectly.getCall(0).args;

                expect( args[0] ).to.equal( OPENED_DATABASE_NAME );
                expect( args[1].replace(/ +/g," ") ).to.equal( EXPECTED_QUERY_STR );
                expect( args[2] ).to.deep.equal( EXPECTED_PLACEHOLDER_PARAM );

                expect(result).to.have.property("path").and.equal( EXPECTED_PATH );
                expect(result).to.have.property("left").and.equal( EXPECTED_MAX - CURRENT_CALLED_COUNT );
            });
        });
        it("failed because query failed.");
    });
});


/*
describe( "api_sql_enumerate.js", function(){
    describe("::updateCalledWithTargetSerial()", function(){
        var stubs;
        var updateCalledWithTargetSerial = api_enumerate.factoryImpl.updateCalled.getInstance();

        beforeEach(function(){ // 内部関数をフックする。
            stubs = COMMON_STUB_MANAGER.createStubs();

            COMMON_STUB_MANAGER.hookInstance( api_enumerate, stubs );
        });
        afterEach(function(){
            COMMON_STUB_MANAGER.restoreOriginal( api_enumerate );
        });

        // ここからテスト。

        it("正常系", function(){
            var IN_SERIALKEY = "abc123456789noncase32number16MAX";
            var EXPECTED_PATH = "期待されたパス";
            var EXPECTED_MAX = 16;
            var CURRENT_CALLED_COUNT = 9;
            var stub_request_query = sinon.stub();
            var sqlConnection = {
                "query" : stub_request_query
            };

            // ↓たぶん不要なハズ。
            // stubs.simple_sql.open.onCall(0).returns( stub_request );

            stub_request_query.onCall(0).returns(
                Promise.resolve()
            );

            return shouldFulfilled(
                updateCalledWithTargetSerial(
                    sqlConnection, 
                    TEST_CONFIG_SQL.database, 
                    IN_SERIALKEY, 
                    EXPECTED_PATH,
                    CURRENT_CALLED_COUNT, 
                    EXPECTED_MAX)
            ).then(function(result){
                var buf;
                // ここから続き。
                var EXPECTED_QUERY_STR = "UPDATE [" + TEST_CONFIG_SQL.database + "].[dbo].[redirect_serial]";
                EXPECTED_QUERY_STR += " SET [called]=" + CURRENT_CALLED_COUNT;
                EXPECTED_QUERY_STR += " WHERE [serial]='" + IN_SERIALKEY + "'";

                // クエリー生成済みなので、呼び出し文字列チェックからスタートする。
                assert(stub_request_query.calledOnce, "mssql::request::query()が1度呼ばれること");
                buf = stub_request_query.getCall(0).args[0].replace(/ +/g,' ');
                expect( buf ).to.equal( EXPECTED_QUERY_STR );

                expect(result).to.have.property("path").and.equal(EXPECTED_PATH);
                expect(result).to.have.property("left").and.equal( EXPECTED_MAX - CURRENT_CALLED_COUNT );
            });
        });
    });
});
// */





