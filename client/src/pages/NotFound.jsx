import { useEffect, useRef } from "react";

const NotFound = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const width = (canvas.width = 256);
    const height = (canvas.height = 256);

    const renderNoise = () => {
      const imageData = ctx.getImageData(0, 0, width, height);

      for (let i = 0; i < imageData.data.length; i += 4) {
        const shade = Math.floor(Math.random() * 255);
        imageData.data[i] = shade;
        imageData.data[i + 1] = shade;
        imageData.data[i + 2] = shade;
        imageData.data[i + 3] = 255;
      }

      ctx.putImageData(imageData, 0, 0);
      requestAnimationFrame(renderNoise);
    };

    renderNoise();
  }, []);

  return (
    <div className="min-h-screen w-full flex flex-col">
      <div className="flex flex-col flex-1 min-h-0">
        <div className="font-Oswald relative grow w-full overflow-hidden bg-white">
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none"
          ></canvas>

          <div className="absolute inset-0 bg-noise"></div>

          <div className="absolute inset-0 bg-linear-to-br from-transparent to-black opacity-70 pointer-events-none"></div>

          <div className="scanline"></div>
          <div className="scanline delay"></div>

          <div className="absolute top-1/2 left-1/2 w-full max-w-125 -translate-x-1/2 -translate-y-1/2 text-center px-4">
            <h1
              className="
                  funny-text 
                  font-bold
                  text-[6rem] sm:text-[10rem] md:text-[14rem] lg:text-[16rem]
                  leading-none
                  dark:text-white
                "
            >
              404
            </h1>

            <p
              className="
                  funny-text 
                  text-lg sm:text-xl md:text-2xl
                  font-light tracking-wide mt-4
                  dark:text-white
                "
            >
              PAGE NOT FOUND.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
