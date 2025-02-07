import React from "react";
function ThankYouPage() {
  return (
    <div className="container mx-auto py-6 px-4 text-center">
      <h1 className="text-3xl font-bold mb-6">Ačiū už jūsų užsakymą!</h1>
      <p className="text-lg text-gray-700 mb-6">
        Mūsų komanda netrukus susisieks su jumis dėl užsakymo detalių.
      </p>
      <a
        href="/uzsakymai"
        className="inline-block mt-6 px-6 py-3  justify-center rounded-md bg-black px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus:outline-black"
      >
        Peržiūrėti užsakymus ir sekitę jų statusą
      </a>
    </div>
  );
}

export default ThankYouPage;
