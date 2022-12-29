import sys
import path
sys.path.append("/Users/tomo/opt/miniconda3/lib/python3.9/site-packages (0.3.2)")
for p in sys.path:
    print(p)

from mlask import MLAsk
emotion_analyzer = MLAsk()
emotion_analyzer.analyze('こんな朝にはただただ世界が好きでたまらないという気がしない？')