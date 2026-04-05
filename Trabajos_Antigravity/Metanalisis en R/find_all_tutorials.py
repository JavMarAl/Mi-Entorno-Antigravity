import requests
import xml.etree.ElementTree as ET

def main():
    sitemap_url = "https://www.dsquintana.blog/sitemap-posts.xml" # Ghost blogs usually have this
    headers = {'User-Agent': 'Mozilla/5.0'}
    
    r = requests.get(sitemap_url, headers=headers)
    if r.status_code != 200:
        print(f"Failed to get sitemap: {r.status_code}")
        # Try default sitemap
        sitemap_url = "https://www.dsquintana.blog/sitemap.xml"
        r = requests.get(sitemap_url, headers=headers)
        if r.status_code != 200:
            print(f"Failed default sitemap too.")
            return

    root = ET.fromstring(r.content)
    namespace = {'ns': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
    urls = [elem.text for elem in root.findall('.//ns:loc', namespace)]
    
    print(f"Total posts found in sitemap: {len(urls)}")
    
    filtered_urls = []
    keywords = ['r', 'meta-analysis', 'plot', 'bayes', 'statistics', 'tutorial', 'code', 'data', 'gosh', 'forest', 'funnel']
    
    for url in urls:
        # Check URL string for clues
        if any(kw in url.lower() for kw in keywords):
            filtered_urls.append(url)
            
    print(f"\nFiltered potential tutorials ({len(filtered_urls)}):")
    for u in filtered_urls:
        print(u)

if __name__ == "__main__":
    main()
