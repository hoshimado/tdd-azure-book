/*
    [vue_promise_test.js]
    encoding=utf-8
*/

var chai = require("chai");
var assert = chai.assert;
var expect = chai.expect;
var sinon = require("sinon");
var promiseTestHelper = require("promise-test-helper");
var shouldFulfilled = promiseTestHelper.shouldFulfilled;
var target = require("../../src/public/javascripts/vue_client.js");


describe("TEST for vue_client.js", function(){
    this.timeout( 5000 );
    var stub_vue, stub_static_vue;
    var stub_fooked_axios = {};
	var original;
	beforeEach(()=>{ // フック前の関数を保持する。
		original = {
            "vueAccountInstance" : target.client_lib.vueAccountInstance,
            "axios" : target.client_lib.axios,
            "getTimeDifferenceHourForShow" : target.client_lib.getTimeDifferenceHourForShow,
            "convertTimezoneInActivityList" : target.client_lib.convertTimezoneInActivityList
        };

        stub_vue = sinon.stub();
        stub_static_vue = {
            "component" : sinon.stub()
        };

        target.client_lib.vueAccountInstance = {
            "userName"    : "dummy_Name12",
            "passKeyWord" : "dummy_KeyWord15"
        };
        target.client_lib.axios = stub_fooked_axios;
	});
	afterEach(()=>{ // フックした（かもしれない）関数を、元に戻す。
        // target.set.data_manager = original.data_manager;

        target.client_lib.vueAccountInstance = original.vueAccountInstance;
        target.client_lib.axios = original.axios;
        target.client_lib.getTimeDifferenceHourForShow = original.getTimeDifferenceHourForShow;
        target.client_lib.convertTimezoneInActivityList = original.convertTimezoneInActivityList;
	});

    describe("::deleteLastActivityDataInAccordanceWithGrid()", function(){
        var hook = target.client_lib
        it("正常系：サーバー側のタイムゾーンはGMT", function(){
            var deleteLastActivityDataInAccordanceWithGrid = hook.deleteLastActivityDataInAccordanceWithGrid;
            var fakeLastActivitiyDate = "2018-01-06 08:42:16.000";
            var EXPECTED_USER = {
                "userName" :    hook.vueAccountInstance.userName,
                "passKeyWord" : hook.vueAccountInstance.passKeyWord
            };
            var EXPECTED_RESPONSE = {
                "number_of_logs" : "ログデータの残数（数値）",
                "device_key" : EXPECTED_USER.userName
            };
            var stub_getTimeDifferenceHourForShow 
            = sinon.stub().onCall(0).returns(+9); 
            // ここでは「表示用には、-9hする（時差は＋９ｈを返す）」ケースを考える。
            // ※サーバー側がGMTで、表示をJSTにしたい場合を想定。
            hook.getTimeDifferenceHourForShow = stub_getTimeDifferenceHourForShow;

            // ※「stub_fooked_axios」はbeforeEach(), afterEach() の外で定義済み＆clinet_libに接続済み。
            stub_fooked_axios["get"] = sinon.stub();
            stub_fooked_axios["post"] = sinon.stub();

            stub_fooked_axios.post.onCall(0).returns(
                Promise.resolve({
                    "data" : EXPECTED_RESPONSE
                })
            );

            // client_lib.vueAccountInstance には、beforeEach(), afterEach() にて、
            // 以下を設定済み。
            // 実動作環境では、以下を持つVue.jsインスタンスが、_vueAppSetup()の戻り値を
            // 経由して設定される（（dataプロパティ名は省略してアクセス可能）。
            // data: {
            //    "userName": "",
            //    "passKeyWord" : ""
            // },

            return shouldFulfilled(
                deleteLastActivityDataInAccordanceWithGrid( fakeLastActivitiyDate )
            ).then(function(){
                expect( stub_getTimeDifferenceHourForShow.callCount ).to.equal( 1, "getTimeDifferenceHourForShow()を1度呼ぶこと" );

                var stub_post_args = stub_fooked_axios.post.getCall(0).args;
                expect( stub_fooked_axios.get.callCount ).to.equal( 0, "axios.get()は呼ばれないこと。" )
                expect( stub_post_args[0] ).to.equal("./api/v1/activitylog/delete");
                expect( stub_post_args[1] ).to.have.property("device_key").to.equal(EXPECTED_USER.userName);
                expect( stub_post_args[1] ).to.have.property("pass_key").to.equal(EXPECTED_USER.passKeyWord);
                expect( stub_post_args[1] ).to.have.property("date_start").to.equal("2018-01-05 23:41:16.000");
                expect( stub_post_args[1] ).to.have.property("date_end"  ).to.equal("2018-01-05 23:43:16.000");
            });
        });
    });
});



