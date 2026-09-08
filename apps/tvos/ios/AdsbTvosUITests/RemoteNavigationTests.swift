import XCTest

final class RemoteNavigationTests: XCTestCase {
    func testRemoteCanLeaveAircraftListAndOpenScreens() {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launch()
        let radar = app.buttons["◎  Radar"]
        XCTAssertTrue(radar.waitForExistence(timeout: 30))
        let remote = XCUIRemote.shared
        for _ in 0..<10 {
            if radar.hasFocus { break }
            remote.press(.up)
        }
        XCTAssertTrue(radar.hasFocus, "The remote must be able to reach the navigation bar from the aircraft list.")
        remote.press(.right)
        XCTAssertTrue(app.buttons["↗  Overhead"].hasFocus)
        remote.press(.select)
        XCTAssertTrue(app.staticTexts["Overhead & approaching"].waitForExistence(timeout: 5))
        remote.press(.menu)
        XCTAssertTrue(app.staticTexts["Your sky, right now."].waitForExistence(timeout: 5))
    }
}
