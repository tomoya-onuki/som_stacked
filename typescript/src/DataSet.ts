import dayjs from 'dayjs';
import { Data } from './Data';

export class DataSet {

    private _list: Data[] = [];

    constructor() {
    }

    public entry(csvString: string) {
        // let tmp: string[][] = this.parseCSV(csvString).slice(1);
        // this._list = tmp.map(line => {
        this._list = csvString.split('\n').slice(1).map(line => {
            let d: string[] = line.split(',');
            let emotions: string[] = [];
            if (d[5] !== '') {
                emotions = d[5].split('-');
            } else {
                emotions.push(Number(d[1]) > 0 ? 'positive' : 'negative');
            }

            // console.log(dayjs(d[0]).format(), d[0]);
            return new Data(
                dayjs(d[0]).valueOf(),
                Number(d[1]),
                Number(d[2]) / Number(d[4]),
                Number(d[3]) / Number(d[4]),
                emotions,
                d[6]
            );
        });
        this._list.sort((a, b) => a.date - b.date);
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