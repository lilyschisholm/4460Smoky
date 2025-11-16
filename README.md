# The Great Smoky Mountains

**Team YALK:** Yulin Lu, Chih-Ying Lee, Lily Chisholm, Katelyn Gumagay  
**Course:** Georgia Tech CS 4460 – Data Visualization, Fall 2025


## Overview

This project visualizes the recovery of the Great Smoky Mountains National Park from decades of air pollution and ecosystem decline. By combining multiple datasets, we explore how improvements in air quality, water chemistry, and biodiversity have contributed to the park’s recovery, and how these changes correlate with human visitation trends.

The interactive visualization tells the story of the park’s resilience through:

- **Air Quality:** Visibility improvements tracked via particulate matter (PM2.5) levels.  
- **Water Chemistry:** Acid Neutralizing Capacity (ANC) in streams, showing how water quality recovers over time.  
- **Biodiversity:** Changes in species populations, highlighting ecosystem recovery.  
- **Visitation:** Park visitor trends reflecting the effect of environmental recovery on human activity.  
- **National Context:** Comparison of species richness across the top 10 U.S. national parks.  


## Features

- **Interactive Charts:** Line charts, heatmaps, area charts, and bar charts with brushing and filtering capabilities.  
- **Animated Effects:**  
  - Cursor-based “acid rain” in the Water section.  
  - Wave background animation in section headers.  
  - Animated species illustrations for ecological recovery.  
- **Dynamic Tooltips:** Provide detailed information when hovering over charts and data points.  
- **Responsive Layout:** Charts and sections adjust dynamically to different screen sizes.  


## Data

All datasets are included in the `data/` folder:

- **Air Quality:** `airQualityData.csv`, `airQualityData_clean.csv`  
- **Water Chemistry:** `waterResults.csv`, `waterSurveyResults.zip`  
- **Biodiversity:** Multiple `.json` files including fish, plant, amphibian, and bird data.  
- **Visitation & Visibility:** `visits.csv`, `visibility.csv`  
- **Park Comparisons:** `parksData.csv`  

Scripts used to process the data are included:

- `data.py`  
- `biodiversityDatasort.py`  


## File Structure

css/ → Stylesheets for layout, sections, and components

js/ → Custom scripts for charts, interactivity, and animations

sprites/ → Image assets (Wave.png, acid.png, Cloud.png)

data/ → Raw and processed datasets

index.html → Main webpage

README.md → Project documentation



## How to Run

1. Clone the repository:  

```bash
git clone https://github.gatech.edu/kgumagay3/4460Smoky.git
```
2. Open index.html in a modern web browser.

3. Interact with the visualizations:
  - Hover over charts for tooltips.
  - Move the cursor over the Water section to see the interactive “acid rain” effect.
  - Use dropdowns and brushes to explore biodiversity data.

## URLs

Project Website: [Insert live site URL here]

Screencast Video: [Insert screencast URL here]

## Non-Obvious Features

- Rain drops spawn from the cursor and only appear within the Water section.
- ANC heatmap and trendline charts are linked; selecting a range in the trend updates the heatmap.Opacity of PM2.5 visualization correlates with visitation, showing the real impact of air quality.
- Biodiversity charts allow species-level exploration with interactive dropdowns and timeline brushing.

## Technologies & Libraries Used

JavaScript Libraries: D3.js (v7), TopoJSON
Python: Data cleaning and processing scripts (data.py, biodiversityDatasort.py)
HTML/CSS: Responsive layout and animated effects
Assets: PNG, SVG, and JPG images for visual embellishments

## Conclusion

The Great Smoky Mountains’ recovery demonstrates that ecosystems heal as systems. Improvements in air and water quality lead to species recovery, which in turn attracts human visitors. This project highlights how environmental policies and conservation efforts can have measurable, long-lasting effects.
