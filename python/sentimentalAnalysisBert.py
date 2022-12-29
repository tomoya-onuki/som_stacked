from transformers import pipeline, AutoModelForSequenceClassification, BertJapaneseTokenizer
from janome.tokenizer import Tokenizer
import re
import codecs
import csv
import json


class Bert:
    def __init__(self):
        """
        コンストラクタ
        """
        model = AutoModelForSequenceClassification.from_pretrained('daigo/bert-base-japanese-sentiment') 
        tokenizer = BertJapaneseTokenizer.from_pretrained('cl-tohoku/bert-base-japanese-whole-word-masking')
        self.nlp = pipeline("sentiment-analysis",model=model,tokenizer=tokenizer)
        self.document = None

    def analyze(self,text = None):
        '''
        感情分析
        Returns:
        --------
            {'label':str,'score':float}  ネガポジの結果と確率を辞書形式で返す   
       
        '''
        return self.nlp(self.document if text is None else text)

    def read_file(self,filename,encoding='utf-8'):
        '''
        ファイルの読み込み

        Parameters:
        --------
            filename : str　 分析対象のファイル名 
        '''
        with codecs.open(filename,'r',encoding,'ignore') as f:
            self.read_text(f.read())

    def read_text(self,text):
        '''
        テキストの読み込み

        Parameters:
        --------
            text : str  分析対象のテキスト
        '''
        # 形態素解析を用いて名詞のリストを作成
        self.document = text




class JanomeJSD:
    def __init__(self,dic_path):
        """
        コンストラクタ
        """
        self.words = []
        self.dic = self.read_dic(dic_path)
    
    def analyze(self):
        '''
        感情分析

        Returns:
        --------
            (int,int,int,int) 　ポジティブ数、ネガティブ数、ニュートラル数、判定不可数
        '''
        posi = 0
        nega = 0
        neut = 0
        err = 0

        for word in self.words:
            res = self.dic.get(word,'-')
            if res == 'p':
                posi += 1
            elif res == 'n':
                nega += 1
            elif res == 'e':
                neut += 1
            else:
                err += 1
        return posi,nega,neut,err
                
    def word_separation(self,text):
        """
        形態素解析により名詞、形容詞、動詞を抽出

        ---------------
        Parameters:
            text : str         テキスト
        """
        token = Tokenizer().tokenize(text)
        words = []
    
        for line in token:
            tkn = re.split('\t|,', str(line))
            # 名詞、形容詞、動詞で判定
            if tkn[1] in ['名詞','形容詞','動詞'] :
                words.append(tkn[0])  
        return words

    def read_dic(self,filename):
        with codecs.open(filename,'r','utf-8','ignore') as f:
            lines = f.readlines()    
            dic = { x.split('\t')[0]:x.split('\t')[1] for x in lines }
        return dic

    def read_file(self,filename,encoding='utf-8'):
        '''
        ファイルの読み込み

        Parameters:
        --------
            filename : str  分析対象のファイル名 
        '''
        with codecs.open(filename,'r',encoding,'ignore') as f:
            self.read_text(f.read())

    def read_text(self,text):
        '''
        テキストの読み込み

        Parameters:
        --------
            text : str   分析対象のテキスト
        '''
        # 形態素解析を用いて名詞のリストを作成
        self.words = self.word_separation(text)



# file = 'mytweet.csv'
# csv_file = open(file, "r", encoding="utf-8")
# f = csv.reader(csv_file, delimiter=",", doublequote=True, lineterminator="\r\n", quotechar='"', skipinitialspace=True)

json_open = open('../data/tweets.json', 'r')
json_load = json.load(json_open)




bert = Bert()
jjsd = JanomeJSD('./res/pn.csv.m3.120408.trim')

def bertScore(input):
    score = input[0].get('score')
    if input[0].get('label') == 'ネガティブ':
        score *= -1
    return score

def jjsdScore(input):
    pos = input[0]
    return pos / sum(input) if sum(input) > 0 else 0

outstr = 'time, score, positive, negative, text\n'

# for i, row in enumerate(f):
#     # print(row)
#     time = row[0]
#     text = row[1]
#     bert.read_text(text)
#     res0 = bert.analyze()
#     score = bertScore(res0)

#     jjsd.read_text(text)
#     res1 = jjsd.analyze()
#     positive = res1[0]
#     negative = res1[1]
#     # score1 = jjsdScore(res1)
#     # print(time, score0, score1, text)
#     print(i)
#     outstr += time + ',' + str(score) + ',' + str(positive)  + ',' + str(negative)+ ',' + text + '\n'
# csv_file.close()

for i, obj in enumerate(json_load):
    # print(obj["tweet"]["created_at"])
    # print(obj["tweet"]["full_text"])
    time = obj["tweet"]["created_at"]
    text = obj["tweet"]["full_text"]

    text = str(text).replace("\n","")    # ツイート内の改行を削除
    if "RT" in text:  # RTは書き込まない
        pass
    elif "#質問箱" in text:
        pass
    elif "@YouTube" in text:
        pass
    else:
        text = text.replace('RT ', '')
        text = re.sub(r'^@[0-9a-zA-Z_]{1,15}', '', text)
        text =  re.sub(r"(https?|ftp)(:\/\/[-_\.!~*\'()a-zA-Z0-9;\/?:\@&=\+\$,%#]+)", "" ,text)
        if text != '':
            bert.read_text(text)
            res0 = bert.analyze()
            score = bertScore(res0)

            jjsd.read_text(text)
            res1 = jjsd.analyze()
            positive = res1[0]
            negative = res1[1]
            total = res1[3]

            print(str(i), time, text)
            outstr += time + ',' + str(score) + ',' + str(positive)  + ',' + str(negative)+ ',' + str(total) + ',' + text + '\n'

out = open('outdata.csv', 'w')
out.write(outstr)
out.close()

