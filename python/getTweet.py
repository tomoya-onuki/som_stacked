import tweepy
from datetime import timedelta
import re
 
# 取得したキーを格納
CK = "glUL4Tgs5uAGJBLbDm3fzLBqa"
CS = "G6i9sRV0Yq4lNDXTpMgdR5cCOjiVGFhpC3Oy20d0NSoY9jRqzt"
AT = "872286707508330496-4yU2RnAUvaqptmUdt9X8JWXxaG6tJ57"
AS = "a9Ilz5EPHGKhASAR0TDJZ44m9l7uwSyRHLVEsZgFtZVF3"
 
# Tweepy設定
auth = tweepy.OAuthHandler(CK, CS) # Twitter API認証
auth.set_access_token(AT, AS) # アクセストークン設定
api = tweepy.API(auth) # オブジェクト設定

#タイムライン取得
result = api.home_timeline(count=1)

# for tweet in result:
#     print('='*80)
#     print('ツイートID : ', tweet.id)
#     print('ツイート時間 : ', tweet.created_at)
#     print('ツイート本文 : ', tweet.text)
#     print('ユーザ名 : ', tweet.user.name) 
#     print('スクリーンネーム : ', tweet.user.screen_name) 
#     print('フォロー数 : ', tweet.user.friends_count) 
#     print('フォロワー数 : ', tweet.user.followers_count) 
#     print('概要 : ', tweet.user.description) 
#     print('='*80)

start = '2020-07-07_00:00:00_JST'
end = '2020-10-01_00:00:00_JST'
i = 0
with open("mytweet.csv", "a+") as tf:
    for status in tweepy.Cursor(api.user_timeline).items():
        try:
            text = str(status.text).replace("\n","")    # ツイート内の改行を削除
            # time = str(status.created_at) # ツイート時刻
            time = str(status.created_at + timedelta(hours=+9)) # ツイート時刻
            if "RT" in text:  # RTは書き込まない
                pass
            elif "#質問箱" in text:
                pass
            elif "@YouTube" in text:
                pass
            elif "http" in text:
                pass
            else:
                text = text.replace('RT ', '')
                text = re.sub(r'^@[0-9a-zA-Z_]{1,15}', '', text)
                text =  re.sub(r"(https?|ftp)(:\/\/[-_\.!~*\'()a-zA-Z0-9;\/?:\@&=\+\$,%#]+)", "" ,text)
                if text != '':
                    tf.write(time + ',' + text+"\n")
                    print('%d'%(i)+ ': ' + time + ' : ' +text)

            # elif "https" in text: # 画像つきとURL付きツイートを書き込まない
                
            #     tf.write(time + ',' + text+"\n")
            #     print('%d'%(i)+ ': ' + time + ' : ' +text)

            # elif "@" in text: # リプの場合はIDを取り除いて書き込む
                
            #     tf.write(time + ',' + text+"\n")
            #     print('%d'%(i)+ ': ' + time + ' : ' +text)

            # else:
            #     tf.write(time + ',' + text+"\n")
            #     print('%d'%(i)+ ': ' + time + ' : ' +text)
        except UnicodeEncodeError: # 実行していると突然UnicodeEncodeErrorが出るが続ける
            pass
        i+=1
