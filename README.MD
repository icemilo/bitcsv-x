# bitcsv-x
A CLI-tool to extract data between dates from csv data from [bitcoincharts.com](http://bitcoincharts.com).

##Installation

```
$ npm install -g bitcsv-x
```

##Usages

```
$ bitcsv-extract

Extracts large csv file to smaller csv by dates
Usage:
bitcsv-x [-n] -i /path/to/file.csv -o /path/to/output.csv-s 02-05-2015 -e 04-05-2015

Options:
  -n, --new     get new data from server
  -i, --input   input file path                   [required]
  -o, --output  output file path                  [required]
  -s, --start   start date of record(dd/mm/yyyy)  [required]
  -e, --end     end date of record(dd/mm/yyyy)    [required]

Missing required arguments: i, o, s, e
```