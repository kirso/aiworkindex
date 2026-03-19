# Request for Occupation-Level Employment Data

**To:** mom_rsd@mom.gov.sg (Research & Statistics Division)
**CC:** singstat_info@singstat.gov.sg
**Subject:** Request for occupation-level employment data (SSOC 5-digit) for academic research

---

Dear Research & Statistics Division,

I am building an open-source AI labour market impact model for Singapore (https://aiworkindex.pages.dev) that scores 562 SSOC occupations for AI displacement risk using Felten AIOE, Pizzinelli theta (IMF), and MOM labour market data.

Our model currently uses MOM's published Occupational Wage Survey data at the 5-digit SSOC level for wages (500+ occupations). However, employment counts are only available at the 9 major occupation group level. This forces us to distribute group-level employment equally across occupations within each group, which significantly limits the accuracy of our market resilience layer.

I am writing to request access to employment count data at the 5-digit SSOC level (or the most granular level available). Specifically:

1. **Employed residents by detailed occupation (SSOC 4-digit or 5-digit)** — aggregate headcount, not individual records. Even a single recent year (2023 or 2024) would be valuable.
2. If the above is not available publicly, could you advise whether the **Census 2020 occupation-level employment tabulations** (coded at 5-digit SSOC per the Census methodology paper) are available for research use?
3. Alternatively, are the **Occupational Employment Dataset (OED) aggregate statistics** — such as total headcount per SSOC code across all employer submissions — available for research access?

For context:

- The project is MIT-licensed and fully open source
- We cite MOM data sources (SOL 2026, Jobs in Demand 2025, wages, labour market reports) with attribution
- Our methodology references peer-reviewed work: Felten et al. (2021, Strategic Management Journal), Pizzinelli et al. (2023, IMF), Frank et al. (2025, PNAS Nexus)
- We do not need individual-level or employer-level data — only aggregate counts per SSOC code

I would be happy to share our methodology paper or sign a data use agreement if required.

Thank you for your time and for the excellent data that MOM already publishes.

Best regards,
Kirill So
https://aiworkindex.pages.dev
https://github.com/kirso/aiworkindex
