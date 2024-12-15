'use client';

import type { NextPage } from "next";
import WeakHandsUI from "~~/components/weakhands/WeakHandsUI";
import ContractStats from '~~/components/weakhands/ContractStats';
import contractConfig from '~~/components/weakhands/ContractConfig';

const Home: NextPage = () => {
  return (
<main className="flex min-h-screen flex-col items-center justify-center p-8 bg-[url('~~/public/hand-01.svg')] bg-left-bottom bg-no-repeat bg-contain bg-opacity-50">
<div className="flex flex-col items-center justify-center max-w-3xl">
      {/* <ContractStats contractConfig={contractConfig} /> */}

        <WeakHandsUI />
      </div>
    </main>
  );
};

export default Home;