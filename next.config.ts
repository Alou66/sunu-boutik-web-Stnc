import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const nextConfig: NextConfig = {
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error"] } : false,
  },
  experimental: {
    // Le cache disque de Turbopack (activé par défaut depuis Next 16.1) peut
    // resservir une page compilée avant les derniers changements au premier
    // chargement après un redémarrage du serveur — d'où le besoin d'un hard
    // refresh pour voir le nouveau formulaire. On le désactive en dev.
    turbopackFileSystemCacheForDev: false,
  },
};

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  // Le SW n'a de sens qu'en prod : en dev il servirait des assets périmés
  // depuis le cache et gênerait le hot-reload.
  disable: process.env.NODE_ENV === "development",
  reloadOnOnline: true,
});

export default withSerwist(nextConfig);
