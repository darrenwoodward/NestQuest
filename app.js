

// Wait for the DOM to be fully loaded before running the script
document.addEventListener('DOMContentLoaded', function () {

    // Define variables for the form fields
    const submitButton = document.querySelector('button[type="submit"]');

    // Constants
    const naturalLightScores = [
        { name: "Very Poor", minScore: 0, maxScore: 5 },
        { name: "Poor", minScore: 5, maxScore: 15 },
        { name: "Fair", minScore: 15, maxScore: 30 },
        { name: "Good", minScore: 30, maxScore: 60 },
        { name: "Excellent", minScore: 60, maxScore: Infinity },
    ];

    // Define a function to handle form submission
    function handleSubmit(event) {
        event.preventDefault();

        const latitude = Number(document.getElementById('latitude').value);
        const longitude = Number(document.getElementById('longitude').value);
        const room = document.getElementById('room').value;
        const windowCount = Number(document.getElementById('window-count').value);
        const windowSize = document.querySelector('input[name="window-size"]:checked').value;
        const windowDirections = Array.from(document.querySelectorAll('input[name="window-directions[]"]:checked'))
            .map(direction => Number(direction.value));
        const date = new Date(document.getElementById('datetime-picker').value);

        const naturalLightScore = calculateNaturalLightScore(latitude, longitude, date, windowCount, windowSize, windowDirections);

        displayNaturalLightScore(naturalLightScore);
    }


    function getDayOfYear(year, month, day) {
        const isLeapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
        const daysInMonth = [
            31,
            isLeapYear ? 29 : 28,
            31,
            30,
            31,
            30,
            31,
            31,
            30,
            31,
            30,
            31
        ];

        let dayOfYear = day;

        for (let i = 0; i < month - 1; i++) {
            dayOfYear += daysInMonth[i];
        }

        return dayOfYear;
    }

    // Attach an event listener to the form submit button
    submitButton.addEventListener('click', handleSubmit);



    function getDeclination(dayOfYear) {
        const radians = (dayOfYear - 1) * 2 * Math.PI / 365;
        const declination = 0.396372 - 22.91327 * Math.cos(radians) + 4.02543 * Math.sin(radians) - 0.387205 * Math.cos(2 * radians) + 0.051967 * Math.sin(2 * radians) - 0.154527 * Math.cos(3 * radians) + 0.084798 * Math.sin(3 * radians);
        return declination;
    }

    // Function to calculate the natural light score for a given room and address
    function calculateNaturalLightScore(latitude, longitude, date, windowCount, windowSize, windowDirections) {
        // Convert latitude and longitude to radians
        const latRad = latitude * Math.PI / 180;
        const lonRad = longitude * Math.PI / 180;

        // Get the day of the year
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const dayOfYear = getDayOfYear(year, month, day);

        // Calculate the solar declination angle
        const declination = getDeclination(dayOfYear);

        // Calculate the solar time
        const offset = -4;
        const solarTime = getSolarTime(date, longitude, offset);

        // Calculate the solar hour angle
        const hourAngle = getHourAngle(solarTime);

        // Calculate the solar altitude angle
        const solarAltitudeRadians = getSolarAltitudeRadians(latRad, declination, hourAngle);

        // Calculate the solar azimuth angle
        const solarAzimuthRadians = getSolarAzimuthRadians(latRad, solarAltitudeRadians, declination, hourAngle);

        // Calculate the natural light score
        const azimuthLeft = windowDirections[0] - 22.5 < 0 ? windowDirections[windowDirections.length - 1] - 22.5 + 360 : windowDirections[0] - 22.5;
        const azimuthRight = windowDirections[windowDirections.length - 1] + 22.5 > 360 ? windowDirections[0] + 22.5 - 360 : windowDirections[windowDirections.length - 1] + 22.5;
        const azimuthRatio = (Math.max(0, Math.min(1, (solarAzimuthRadians - azimuthLeft) / 45)) + Math.max(0, Math.min(1, (azimuthRight - solarAzimuthRadians) / 45))) / 2;
        const cosH = Math.max(0, Math.min(1, Math.cos(solarAltitudeRadians)));
        const cosA = Math.max(0, Math.min(1, Math.cos(solarAzimuthRadians - windowDirections[0] * Math.PI / 180)));
        const windowArea = getWindowArea(windowSize);
        const naturalLightScore = (Math.round(100 * windowCount * azimuthRatio * cosH * cosA * windowArea) / 100) * 10;

        // Calculate the natural light score
        //   let cosA = 0;
        //   let azimuthRatio = 0;
        //   for (let i = 0; i < windowDirections.length; i++) {
        //     const azimuthLeft = windowDirections[i] - 22.5 < 0 ? windowDirections[windowDirections.length - 1] - 22.5 + 360 : windowDirections[i] - 22.5;
        //     const azimuthRight = windowDirections[i] + 22.5 > 360 ? windowDirections[0] + 22.5 - 360 : windowDirections[i] + 22.5;
        //     const azimuthDifference = Math.abs(solarAzimuthRadians - windowDirections[i] * Math.PI / 180);
        //     const angleDifference = Math.abs(windowAngles[i] - azimuthDifference);
        //     azimuthRatio += Math.max(0, Math.min(1, (solarAzimuthRadians - azimuthLeft) / 45)) + Math.max(0, Math.min(1, (azimuthRight - solarAzimuthRadians) / 45));
        //     cosA += Math.cos(angleDifference);
        //     }
        //   const windowArea = getWindowArea(windowSize);
        //   const naturalLightScore = Math.round(100 * windowCount * azimuthRatio / windowDirections.length * Math.max(0, Math.min(1, Math.cos(solarAltitudeRadians))) * cosA * windowArea) / 100;

        // Display the final natural light score to the user
        console.log(`The natural light score for ${room} at this home is ${naturalLightScore}%.`);

        // Return the natural light score
        return naturalLightScore
    }

    // Function to get the day of the year
    function getDayOfYear(year, month, day) {
        const isLeapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
        const daysInMonth = [31, isLeapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        let dayOfYear = day;
        for (let i = 0; i < month - 1; i++) {
            dayOfYear += daysInMonth[i];
        }
        return dayOfYear;
    }

    // Function to get the solar time
    function getSolarTime(date, longitude, offset) {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const hour = date.getHours();
        const minute = date.getMinutes();
        const second = date.getSeconds();
        const dayOfYear = getDayOfYear(year, month, day);
        const timeZone = -offset / 60;
        const localTime = hour + minute / 60 + second / 3600;
        const solarTime = localTime + getEquationOfTime(dayOfYear) / 60 + 4 * (longitude - 15 * timeZone) / 60;
        return solarTime;
    }

    // Function to get the equation of time
    function getEquationOfTime(dayOfYear) {
        const B = 360 / 365.24 * (dayOfYear - 81);
        const EoT = 9.87 * Math.sin(2 * B * Math.PI / 180) - 7.53 * Math.cos(B * Math.PI / 180) - 1.5 * Math.sin(B * Math.PI / 180);
        return EoT;
    }

    // Function to get the hour angle
    function getHourAngle(solarTime) {
        const hourAngle = (solarTime - 12) * 15;
        return hourAngle;
    }

    // Function to get the solar altitude angle in radians
    function getSolarAltitudeRadians(latRad, declination, hourAngle) {
        const sinAlt = Math.sin(latRad) * Math.sin(declination) + Math.cos(latRad) * Math.cos(declination) * Math.cos(hourAngle * Math.PI / 180);
        const solarAltitudeRadians = Math.asin(sinAlt);
        return solarAltitudeRadians;
    }

    // Function to get the solar azimuth angle in radians
    function getSolarAzimuthRadians(lonRad, solarAltitudeRadians, declination, hourAngle) {
        const cosAzimuth = (Math.sin(solarAltitudeRadians) * Math.sin(lonRad) - Math.sin(declination) * Math.cos(solarAltitudeRadians) * Math.cos(lonRad)) / Math.cos(solarAltitudeRadians);
        const sinAzimuth = -Math.cos(declination) * Math.sin(hourAngle * Math.PI / 180) / Math.cos(solarAltitudeRadians);
        const solarAzimuthRadians = Math.atan2(sinAzimuth, cosAzimuth);
        return solarAzimuthRadians;
    }

    // Function to get the window area
    function getWindowArea(windowSize) {
        const windowWidth = 3;
        const windowHeight = 8;
        const windowArea = windowWidth * windowHeight;
        return windowArea;
    }

    function getWindowSizeValue(windowSizeText) {
        switch (windowSizeText) {
            case 'small':
                return 3;
            case 'medium':
                return 6;
            case 'large':
                return 9;
            default:
                throw new Error('Invalid window size text');
        }
    }


    function displayNaturalLightScore(score) {
        alert(`The natural light score for the room is ${score}.`);
    }

});


