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
    func testSettingsCanBeEnteredAndSavedWithRemote() {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launch()
        let remote = XCUIRemote.shared
        let radar = app.buttons["◎  Radar"]
        XCTAssertTrue(radar.waitForExistence(timeout: 30))
        for _ in 0..<12 {
            if radar.hasFocus { break }
            remote.press(.up)
        }
        XCTAssertTrue(radar.hasFocus)
        for _ in 0..<5 { remote.press(.right) }
        XCTAssertTrue(app.buttons["⚙  Settings"].hasFocus)
        remote.press(.select)
        XCTAssertTrue(app.staticTexts["Your receiver. Your sky."].waitForExistence(timeout: 5))
        remote.press(.down)
        XCTAssertTrue(app.buttons["Explore demo"].hasFocus || app.buttons["Local receiver"].hasFocus,
                      "Down from the Settings menu must enter the form.")
        let save = app.buttons["Save settings"]
        for _ in 0..<14 {
            if save.hasFocus { break }
            if app.buttons["Cancel"].hasFocus { remote.press(.left) }
            else { remote.press(.down) }
        }
        XCTAssertTrue(save.hasFocus, "Save must be reachable without a pointer or swipe.")
        XCTAssertTrue(save.isHittable)
        remote.press(.select)
        XCTAssertTrue(app.staticTexts["Your sky, right now."].waitForExistence(timeout: 5))
    }

}
