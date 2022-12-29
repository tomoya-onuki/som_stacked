2022.12.22  
Tomoya Onuki  

# ひとりごとの形 / 積層体について

- Twitterのひとりごとの形をTime Space Cubeにする
- 感情分析の結果からポジとネガの平面上の点を求めて、STCにする

## 視覚変数
- 平面→ポジネガ平面
- 高さ→時刻(日付)
- 線の太さ→1日のツイート量
- 線の明度→ポジネガの差
- 線の色相と彩度→月

## 配置規則
- STCを一年が360度になるようにぐるぐるさせる→回転系
- 年×月でSTCをならべる→整列系


## メモ
集合体　のような単語
流線形、変動、動体、動的、アメーバ、流動体、積分、連続性、積層、積層体、周期性、巡礼、巡る、回転体、整列系、回転系


### 季節を意味するグラデーション
```
month = [1, 12], 
hue =
    (10 - month) * 20 + 10 if month <= 10
    (22 - month) * 20 + 10 if month > 10

sat = -(month - 1) * (month - 12) * 4 / 121
```
$$
1 \leq \text{month} \leq 12, \text{month} \in N\\

\text{hue} = 
    \begin{cases}
        (10 - \text{month}) * 15 + 40 \quad \text{month} \leq 10 \\
        (22 - \text{month}) * 15 + 40 \quad \text{month} > 10 \\
    \end{cases}
$$