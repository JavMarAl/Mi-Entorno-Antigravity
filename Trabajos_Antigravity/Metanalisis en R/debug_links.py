import requests
from bs4 import BeautifulSoup

def main():
    url = "https://www.dsquintana.blog/tag/meta-analysis/"
    headers = {'User-Agent': 'Mozilla/5.0'}
    r = requests.get(url, headers=headers, timeout=10)
    
    with open("c:\\Trabajos Antigravity\\Metanalisis en R\\links_debug.txt", "w", encoding="utf-8") as f:
        f.write(f"Status: {r.status_code}\n")
        soup = BeautifulSoup(r.content, "html.parser")
        for a in soup.find_all('a'):
            href = a.get('href')
            text = a.get_text().strip()
            if href and 'meta-analysis' in href or 'plot' in href or 'bayes' in href or 'mistake' in href or 'outlier' in href or 'power' in href:
                f.write(f"{text}: {href}\n")

if __name__ == "__main__":
    main()
