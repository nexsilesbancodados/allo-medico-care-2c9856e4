import { useEffect, forwardRef } from "react";
import { useLocation } from "react-router-dom";

/**
 * Scrolls to top on every route change.
 * Place inside <BrowserRouter>.
 */
const ScrollToTop = forwardRef<HTMLDivElement>((_props, _ref) => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null;
});

ScrollToTop.displayName = "ScrollToTop";
export default ScrollToTop;
