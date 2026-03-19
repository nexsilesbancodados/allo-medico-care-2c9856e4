import { describe, it, expect, vi, afterEach } from "vitest";
import { render, unmountComponentAtNode } from "react-dom";
import SEOHead from "@/components/SEOHead";

// Use a real DOM render for <head> manipulation tests
describe("SEOHead", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it("sets document title with site name suffix", () => {
    render(
      // @ts-expect-error - react 18 render
      <SEOHead title="Teleconsulta" />,
      container
    );
    expect(document.title).toContain("Teleconsulta");
    expect(document.title).toContain("AloClinica");
  });

  it("creates og:title meta tag", () => {
    render(
      // @ts-expect-error - react 18 render
      <SEOHead title="Test Page" description="A test desc" />,
      container
    );
    const og = document.querySelector('meta[property="og:title"]') as HTMLMetaElement;
    expect(og).toBeTruthy();
    expect(og?.content).toContain("Test Page");
  });

  it("sets canonical link when provided", () => {
    render(
      // @ts-expect-error - react 18 render
      <SEOHead canonical="https://example.com/test" />,
      container
    );
    const link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    expect(link?.href).toBe("https://example.com/test");
  });

  it("injects JSON-LD script", () => {
    render(
      // @ts-expect-error - react 18 render
      <SEOHead jsonLd={{ "@type": "Organization", name: "AloClinica" }} />,
      container
    );
    const script = document.getElementById("seo-jsonld");
    expect(script).toBeTruthy();
    expect(script?.textContent).toContain("AloClinica");
  });
});
