import { HelmetProvider, Helmet } from "react-helmet-async";

export const APP_TITLE = "ADMIN | Bliss Membership Console";

// Every page uses the console title; per-page `title` props are kept for
// call-site compatibility but no longer shown in the browser tab.
const PageMeta = ({
  description,
}: {
  title?: string;
  description?: string;
}) => (
  <Helmet>
    <title>{APP_TITLE}</title>
    <meta name="description" content={description || "Touchwood Bliss membership administration"} />
  </Helmet>
);

export const AppWrapper = ({ children }: { children: React.ReactNode }) => (
  <HelmetProvider>{children}</HelmetProvider>
);

export default PageMeta;
