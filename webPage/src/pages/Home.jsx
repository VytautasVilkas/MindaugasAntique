import React, { useState } from "react";
import Typewriter from "typewriter-effect";
import mainMenuImage from "../assets/mainMenu.jpeg";

function Home() {
  const [isTypingDone, setIsTypingDone] = useState(false);

  return (
    <div className="min-h-screen flex flex-col justify-between relative pb-16">
      {/* Main Content */}
      <div className="relative flex flex-col items-center justify-center">
        {/* Image Container */}
        <div
          className="relative w-full max-w-screen-xl mx-auto h-[600px] mt-4 rounded-t-lg shadow-lg overflow-hidden"
          style={{
            clipPath: "polygon(0 0, 100% 0, 100% 85%, 0 100%)", // Curvy bottom shape
          }}
        >
          {/* Dark Overlay */}
          <div className="absolute inset-0 bg-black/65 z-10"></div>
          <img
            src={mainMenuImage}
            alt="Main Menu"
            className="w-full h-full object-cover z-0"
          />

          {/* Text Container */}
          <div
            className="font-oldStandard  absolute inset-0 flex flex-col justify-center items-center text-white z-20 p-6 hover:scale-101"
            style={{
              clipPath: "polygon(0 0, 100% 0, 100% 85%, 0 100%)", // Matches the image shape
            }}
          >
            <h1
              className="text-2xl sm:text-3xl md:text-4xl font-bold leading-relaxed text-center"
              style={{
                fontSize: "clamp(1.5rem, 4vw, 2.5rem)", // Dynamic font size
              }}
            >
              {!isTypingDone && (
                <Typewriter
                  options={{
                    autoStart: true,
                    delay: 50,
                    loop: false,
                  }}
                  onInit={(typewriter) => {
                    typewriter
                      .typeString("Mada praeina, stilius išlieka.")
                      .pauseFor(500)
                      .typeString(
                        "<br>Unikalumas slypi paprastume ir mažose detalėse."
                      )
                      .pauseFor(500)
                      .typeString("<br>Antique, Retro, Vintage.")
                      .callFunction(() => setIsTypingDone(true))
                      .start();
                  }}
                />
              )}
              {isTypingDone && (
                <>
                  Mada praeina, stilius išlieka.
                  <br />
                  Unikalumas slypi paprastume ir mažose detalėse.
                  <br />
                  Antique, Retro, Vintage.
                </>
              )}
            </h1>

            <p
              className="text-base sm:text-lg md:text-xl leading-relaxed text-center mt-4"
              style={{
                fontSize: "clamp(1rem, 3vw, 1.5rem)", // Dynamic font size
              }}
            >
              Prekiaujame, nuomojame iš Skandinavijos ir kitų šalių atvežtus baldus,
              šviestuvus, interjero detales. Apsižvalgykite mūsų interneto svetainėje
              ir susisiekite su mumis, ar tiesiog atvykite į mūsų parduotuvę.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;






















  
