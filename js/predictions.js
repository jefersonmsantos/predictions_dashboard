document.addEventListener('DOMContentLoaded',function(){
    const monthsNames = {
                            'January':0,
                            'February':1,
                            'March':2,
                            'April':3,
                            'May':4,
                            'June':5,
                            'July':6,
                            'August':7,
                            'September':8,
                            'October':9,
                            'November':10,
                            'December':11
        };
    
    
    const req = new XMLHttpRequest();
    req.open('GET','http://ec2-3-22-223-100.us-east-2.compute.amazonaws.com:3000/matches',true);
    req.send();
    req.onload=function(){
        const json = JSON.parse(req.responseText);
        
        /*Adjusting and sorting dates*/
        const adjustedJson=json.filter(function(match){
            var splitDate = match.Date.split(" ");

            if (splitDate[0].length==3){
                var day=splitDate[0][0];
            } else{
                var day = splitDate[0].substring(0,2);
            }

            var month=monthsNames[splitDate[2]];
            
            var baseDate = new Date(parseInt(splitDate[3]),month,day);
            
                                
            match.Date=baseDate;
            
            return true;
        })

    
        const adjustedSort = adjustedJson.slice();
        const adjustedSortInverse = adjustedJson.slice()       
        
        const sortedAuxiliary = adjustedSort.sort((a,b)=>a.Date>b.Date ? 1 : -1);
        
        var inverseSortedAuxiliary = adjustedSortInverse.sort((a,b)=>a.Date>b.Date ? -1 : 1);
    
        const sortedAdjustedJson = sortedAuxiliary.filter(function(match){
            var baseDate = match.Date;
            var dia = baseDate.getDate().toString();
            var diaF = (dia.length ==1) ? '0'+dia : dia;
            var mes = (baseDate.getMonth()+1).toString();
            var mesF = (mes.length ==1) ? '0'+mes : mes;
            var anoF = baseDate.getFullYear(); 

            match.Date=diaF + "/" + mesF + "/" +anoF;

            return true;
        })


        
        const w = 0.5*window.innerWidth;
        const padding = 50;

        
        /*Scale for graphic*/
        const xScale=d3.scaleLinear().domain([d3.min(dateResults(sortedAdjustedJson),(d,i)=>i),d3.max(dateResults(sortedAdjustedJson),(d,i)=>i)]).range([0.5*padding,window.innerWidth-4*padding]);
        const yScale=d3.scaleLinear().domain([0,1]).range([0.35*window.innerHeight,0.05*window.innerHeight]);

        /*Creating graph svg*/
        const graphSvg = d3.select("#graphBox")
                .append('svg')
                .attr('width',0.9*window.innerWidth)
                .attr('height',0.4*window.innerHeight);

       
        
        var graphContainer = graphSvg.append('g')
                                        .attr('y',0)
                                        .attr('x',0)
                                        .attr('height',0.4*window.innerHeight)
                                        .attr('id','graph');
        

        var axisDates = listDates(dateResults(sortedAdjustedJson));


        const xAxis = d3.axisBottom(xScale)
                    .ticks(5)    
                    .tickFormat((d,i)=> axisDates[i*5]);



        const yAxis = d3.axisLeft(yScale);
        graphContainer.append('g')
            .attr('transform','translate('+0.5*padding+','+0.35*window.innerHeight+')')
            .attr('id','x-axis')
            .call(xAxis);


         graphContainer.selectAll('rect')
                .data(dateResults(sortedAdjustedJson))
                .enter()
                .append('rect')
                .attr('x',(d,i)=>0.5*padding+xScale(i))
                .attr('y',(d)=>yScale(d.Correct/(d.Correct+d.Wrong)))
                .attr('width',(d,i)=>((w-2*padding)/dateResults(json).length)*0.75)
                .attr('height',(d)=>(0.35*window.innerHeight)-yScale(d.Correct/(d.Correct+d.Wrong)))
                .style('fill','rgb(110,140,215)')
                .append('title')
                .attr('id','tooltip')
                .text((d)=>d.Date + "\n" +Math.round(100*d.Correct/(d.Correct+d.Wrong)*10)/10 + "%");
                
        graphContainer.selectAll('.text')
                .data(dateResults(sortedAdjustedJson))
                .enter()
                .append('text')
                .attr('x',(d,i)=>0.5*padding+xScale(i))
                .attr('y',(d)=>yScale(d.Correct/(d.Correct+d.Wrong))-8)
                .attr('width',(d,i)=>((w-2*padding)/dateResults(json).length)*0.75)
                .attr('height',(d)=>(0.75*window.innerHeight)-yScale(d.Correct/(d.Correct+d.Wrong)))
                .text((d)=>Math.round(100*d.Correct/(d.Correct+d.Wrong)*10)/10 + "%")
                .style('font-size',11);

        graphContainer.append('text')
                .attr('x',0.03*window.innerWidth)
                .attr('y',0.03*window.innerHeight)
                .text('Hit-rate / Day')
                .style('font-size',24)
                .style('font-weight','bold')
                .style('font-family','Poppins');



            
        /*Adjust text from result boxes*/
        var correctText = document.getElementById('correctText');
        correctText.textContent=hitRate(json)[0]

        var correctText = document.getElementById('wrongText');
        correctText.textContent=hitRate(json)[1]

        var correctText = document.getElementById('hitrateText');
        correctText.textContent=Number(hitRate(json)[2]).toLocaleString(undefined,{style:'percent',minimumFractionDigits:2})

        var correctText = document.getElementById('openText');
        correctText.textContent=hitRate(json)[3]
        
        
        
        /* Creationg table SVG*/
        const svg = d3.select("#table")
                        .append('svg')
                        .attr('width',3*w+w/8-1.5*padding)
                        .attr('height',json.length*18+1100);

        

        var matchesContainer = svg.append('g')
                                    .attr("id","matches")

        

        var predictions = matchesContainer.selectAll("#matches")
                                            .data(inverseSortedAuxiliary)
                                            .enter()
                                            .append('g')
                                            .attr('transform',(d,i)=>'translate('+0.03*window.innerWidth+','+(20*i)+')')
                                            .attr('class','matchesContainer');
        
        var tableLabel = document.getElementById('labels');
        var labelWidth = tableLabel.clientWidth;

        /* Aligning with labels on HTML*/
        var dateX = document.getElementById('Date').getBoundingClientRect().left-document.getElementById('labels').getBoundingClientRect().left;
        var Team1X = document.getElementById('Team1').getBoundingClientRect().left-document.getElementById('labels').getBoundingClientRect().left;
        var Team2X = document.getElementById('Team2').getBoundingClientRect().left-document.getElementById('labels').getBoundingClientRect().left;
        var TournamentX = document.getElementById('Tournament').getBoundingClientRect().left-document.getElementById('labels').getBoundingClientRect().left;
        var PredictionX = document.getElementById('Prediction').getBoundingClientRect().left-document.getElementById('labels').getBoundingClientRect().left;
        var ResultX = document.getElementById('Result').getBoundingClientRect().left-document.getElementById('labels').getBoundingClientRect().left;

        predictions.append('rect')
                    .attr('y',0)
                    .attr('width',labelWidth)
                    .attr('height',18)
                    .style('fill',(d,i)=>lineColor(i));
        
        /*Data*/
        predictions.append('text')
                    .attr('y',13)
                    .attr('width',w/4)
                    .attr('x',dateX)
                    .attr("height",12)
                    .style("font-size",12)
                    .text((d)=>d.Date);


        /*Team1*/
        predictions.append('text')
                    .attr('x',Team1X)
                    .attr('y',13)
                    .attr('width',w/4)
                    .attr("height",12)
                    .style("font-size",12)
                    .text((d)=>d.Team1);
        
        /*Team2*/
        predictions.append('text')
                    .attr('y',13)
                    .attr('x',Team2X)
                    .attr('width',w/4)
                    .attr("height",12)
                    .style("font-size",12)
                    .text((d)=>d.Team2);
        
        /*Tournament*/
        predictions.append('text')
                    .attr('y',11)
                    .attr('x',TournamentX)
                    .attr('width',w/4)
                    .attr("height",10)
                    .style("font-size",12)
                    .text((d)=>d.Tournament);


        /*Prediction*/
        predictions.append('text')
                    .attr('y',13)
                    .attr('x',PredictionX)
                    .attr('width',w/4)
                    .attr("height",12)
                    .style("font-size",12)
                    .text((d)=>predictWin(d.Team1,d.Team2,d['Team1 Prediction'],d['Team2 Prediction']));


        /*Result*/
        predictions.append('image')
                    .attr('y',20)
                    .attr('href',(d)=>resultImage(d.Result))
                    .attr('transform','scale(0.02,0.02)')
                    .attr('x',ResultX/0.02);

         
        
        /*Find predicted team to win*/

        function predictWin(team1, team2, team1Prediction, team2Prediction){
            if ((team1Prediction<0) & (team2Prediction<0)){
                if (team1Prediction<team2Prediction) {
                    return team1;
                } else {
                    if (team2Prediction<team1Prediction){
                        return team2;
                    } else{
                        return "No prediction"; 
                    }
                }
            } else{
                if (team1Prediction>team2Prediction) {
                    return team1;
                } else {
                    if (team2Prediction>team1Prediction){
                        return team2;
                    } else{
                        return "No prediction"; 
                    }
                }
            }
        }

        function lineColor(i){
            if ((i%2)==0){
                return "#ebebeb";
            } else{
                return "#f6f6f6"
            }
        }

        /*calculate hit rate*/

        function hitRate(file){
            var size = file.length;
            var correct = file.filter(function(match){
                if(match.Result=='correct'){
                    return true;
                }
            })
            
            correctPredictions=correct.length;

            var wrong = file.filter(function(match){
                if(match.Result=='wrong'){
                    return true;
                }
            })

            wrongPredictions=wrong.length;

            var openBets = size-(correctPredictions+wrongPredictions);
            var hitRate = correctPredictions/(correctPredictions+wrongPredictions);

            return [correctPredictions, wrongPredictions, hitRate, openBets];
        }

        function dateResults(file){
            uniqueDates = file.reduce(function(a,b){
                if(a[b['Date']]){
                    a[b['Date']]=[b["Date"]]
                } else{
                    a[b['Date']]=[b["Date"]]
                }
                return a;
            },{});
            
            var dates=Object.keys(uniqueDates);
            
            var resultDict = [];

            dates.filter(function(date){
                var correct = 0;
                var wrong = 0;
                file.filter(function(match){
                    if (match.Date == date){
                        if (match.Result=='correct'){
                            correct++;
                        } else if(match.Result=='wrong'){
                            wrong++;
                        }
                    }
                })
                resultDict.push({Date:date, Correct:correct, Wrong: wrong});
            })
            
            return resultDict;
        }

        /* Result image*/
        function resultImage(result){
            if (result=='correct'){
                return "images/correct.jpg"
            }

            if (result=='wrong'){
                return "images/wrong.png"
            }
        }

        function listDates(dates){
            var newList = [];

            dates.filter(function(date){
                newList.push(date.Date);
            })

            return newList;

        }

        

    }

})