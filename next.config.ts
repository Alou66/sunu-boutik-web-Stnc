import type { NextConfig } from "next";

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

export default nextConfig;
