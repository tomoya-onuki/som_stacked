import dayjs from 'dayjs';
import { Data } from './Data';

export class DataSet {

    private _list: Data[] = [];

    constructor() {
    }

    public entry(csvString: string) {

        this._list = csvString.split('\n').slice(1).map(line => {
            let d: string[] = line.split(',');
            let emotions: string[] = [];
            if (d[5] !== '') {
                emotions = d[5].split('-');
            } else {
                emotions.push(Number(d[1]) > 0 ? 'positive' : 'negative');
            }

            let date: number = dayjs(d[0]).valueOf();
            let tweet: string = d[6];

            return new Data(
                date,
                Number(d[1]),
                Number(d[2]) / Number(d[4]),
                Number(d[3]) / Number(d[4]),
                emotions,
                tweet
            );
        });
        this._list.sort((a, b) => a.date - b.date);

        let startDate = dayjs(this._list[0].date).valueOf();
        let endDate = dayjs(this._list[this._list.length - 1].date).valueOf();

        const today: number = dayjs().valueOf();
        this._list.forEach(d => {
            let newTweet: string = '';
            let tmp = d.tweet.split('');
            let forgetRatio = (today - d.date) / (today - startDate);
            tmp.forEach(char => {
                // ASCIIコード : 33 ~ 126
                let code: number = Math.random() * (126 - 33) + 33;
                let newChar: string = String.fromCharCode(code);
    
                let seed = Math.random();
                if(seed < forgetRatio) {
                    newTweet += newChar;
                } 
                else {
                    newTweet += char;
                }
            });
            d.tweet = newTweet;
        })
    }

    public get() {
        return this._list;
    }

    public slice(date0: number, date1: number): Data[] {
        return this._list.filter(d => date0 <= d.date && d.date < date1);
    }


    private parseCSV(csv: string): string[][] {
        let tmp: string[] = [];
        csv = csv.replace(/("[^"]*")+/g, (match) => {
            tmp.push(match.slice(1, -1).replace(/""/g, '"')); return '[TMP]';
        });
        return csv.split("\n").map((row) => {
            return row.split(',').map((val: string) => {
                return val === '[TMP]' ? String(tmp.shift()) : val;
            });
        });
    };
}