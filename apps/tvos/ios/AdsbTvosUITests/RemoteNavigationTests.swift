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
        var reachedConnection = false
        var reachedRefresh = false
        var reachedDetails = false
        for _ in 0..<14 {
            reachedConnection = reachedConnection || app.buttons["Direct"].hasFocus || app.buttons["Local proxy"].hasFocus
            reachedRefresh = reachedRefresh || app.buttons["1 seconds"].hasFocus || app.buttons["2 seconds"].hasFocus || app.buttons["5 seconds"].hasFocus
            reachedDetails = reachedDetails || app.buttons["Online details"].hasFocus || app.buttons["Local only"].hasFocus
            if save.hasFocus { break }
            if app.buttons["Cancel"].hasFocus { remote.press(.left) }
            else { remote.press(.down) }
        }
        XCTAssertTrue(reachedConnection, "The form controls must be focusable.")
        XCTAssertTrue(reachedRefresh, "The remote must reach rows below the initial viewport.")
        XCTAssertTrue(reachedDetails, "The last settings row must remain reachable above the fixed footer.")
        XCTAssertTrue(save.hasFocus, "Save must be reachable without a pointer or swipe.")
        XCTAssertTrue(save.isHittable)
        remote.press(.select)
        XCTAssertTrue(app.staticTexts["Your sky, right now."].waitForExistence(timeout: 5))
    }

}
