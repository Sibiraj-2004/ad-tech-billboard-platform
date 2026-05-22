import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * ScrollToTop - Automatically scrolls the window to the top on route changes.
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "smooth", // Optional: smooth scrolling
    });
  }, [pathname]);

  return null;
};

export default ScrollToTop;
