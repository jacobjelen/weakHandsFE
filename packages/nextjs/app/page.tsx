'use client';

import type { NextPage } from "next";
import WeakHandsUI from "~~/components/weakhands/WeakHandsUI";

const Home: NextPage = () => {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="flex flex-col items-center justify-center max-w-3xl">
        <WeakHandsUI />
      </div>
    </main>
  );
};

export default Home;