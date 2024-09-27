        const canvas = document.getElementById("canvas1");
        const ctx = canvas.getContext("2d");

        canvas.width=1200;
        // canvas.height=650;
        canvas.height=800;
        // canvas.style.backgroundColor="yellow";
        // //canvas settings
        // ctx.fillStyle="white";
        // ctx.strokeStyle="red";


        class Particle{

            constructor(effect)
            {
                this.effect=effect;
                this.x = Math.floor(Math.random() * this.effect.width) - this.effect.cellsize / 2;
                this.y = Math.floor(Math.random() * this.effect.height) - this.effect.cellsize / 2;
                //added small offset for claude
                // this.x=Math.floor(Math.random()*this.effect.width);
                // this.y=Math.floor(Math.random()*this.effect.height);
                this.speedx;
                this.speedy;
                this.history=[{x:this.x,y:this.y}];
                this.maxlength=Math.floor(20 + Math.random() *50);
                this.angle=0;
                this.newangle=0;
                this.anglecorrector=Math.random()*0.2+0.18;
                this.speedmodifier=Math.random()*2+1;
                this.timer=2*this.maxlength -10;
                // this.colors=['#FF3366', '#FF6B6B', '#4ECDC4', '#45B7D1', '#F7FFF7'];
                // this.color=this.colors[Math.floor(Math.random()*this.colors.length)];
                this.red=0;
                this.green=0;
                this.blue=0;
                this.color='rgb(' +this.red+ ',' +this.green+ ',' +this.blue+ ')';
            }

            draw(context)
            {
                context.save();
                context.beginPath();
                if(this.history.length>5)
                {
                // context.fillStyle=this.color;
                // context.arc(this.x, this.y, 2, 0, 2*Math.PI);
                // context.fill();
                }
                    
                context.strokeStyle=this.color ;
                // context.shadowBlur=10;
                // context.shadowColor=this.color;
                context.lineWidth=1.5;
                context.moveTo(this.history[0].x,this.history[0].y);
                for(let i=0 ; i < this.history.length ; i++)
                {
                    context.lineTo(this.history[i].x,this.history[i].y);
                }
                context.stroke();
                context.restore();
            }

            update()
            {
                this.timer--;
                if (this.timer>=1)
                {
                    let x= Math.floor(this.x/this.effect.cellsize);
                    let y = Math.floor (this.y/this.effect.cellsize);
                    let index=y*this.effect.cols + x;
                    let flowfieldindex=this.effect.flowfield[index];
                    if(flowfieldindex)
                    {
                        // code for the angle calc(gradual change in angle)
                        this.newangle= this.effect.flowfield[index].colortoangle;
                        if ( this.angle>this.newangle)
                            this.angle-=this.anglecorrector;
                        else if(this.angle<this.newangle)
                            this.angle+=this.anglecorrector;

                        else
                            this.angle=this.newangle;
                        
                        //code to make direct angle change
                        // this.angle=this.effect.flowfield[index].colortoangle;


                        //code to gradually change color
                        if(flowfieldindex.alpha>0)
                        {
                            this.red === flowfieldindex.red ? this.red : this.red+=(flowfieldindex.red-this.red)*0.1;
                            this.green===flowfieldindex.green ? this.green : this.green +=(flowfieldindex.green - this.green)*0.1; 
                            this.blue===flowfieldindex.blue ? this.blue : this.blue+=(flowfieldindex.blue-this.blue)*0.4;
                            this.color='rgb(' +this.red+ ',' +this.green+ ',' +this.blue+ ')';   
                        }
                    }
                    
                    this.speedx=Math.cos(this.angle)*this.speedmodifier;
                    this.speedy=Math.sin(this.angle)*this.speedmodifier;
                    
                    this.x+=this.speedx ;
                    this.y+=this.speedy ;
            
                    this.history.push({x:this.x,y:this.y});
                    if( this.history.length > this.maxlength)
                        this.history.shift();
                
                }
                else if (this.history.length>1)
                {
                    this.history.shift();
                }
                else
                {
                    this.reset();
                }
                    
                
            }


            reset()
            {
                
                let attempts=0;
                let success=false;

                while(attempts<20 && !success)
                {
                    attempts++;
                    let testindex=Math.floor(Math.random()*this.effect.flowfield.length);
                    if (this.effect.flowfield[testindex].alpha >0)
                    {
                        this.x=this.effect.flowfield[testindex].x;
                        this.y=this.effect.flowfield[testindex].y;
                        this.history=[{x:this.x,y:this.y}];
                        this.timer=this.maxlength*2;
                        success=true;

                    }
                }


                if(!success && attempts>=20)
                {
                    this.x=Math.floor(Math.random()*this.effect.width);
                    this.y=Math.floor(Math.random()*this.effect.height);
                    this.history=[{x:this.x,y:this.y}];
                    this.timer=this.maxlength*2;
                }
                
            }


        }


        class Effect{
            constructor(canvas,ctx)
            {
                this.canvas=canvas;
                this.ctx=ctx;
                this.width=this.canvas.width;
                this.height=this.canvas.height;
                this.particles=[];
                this.flowfield=[];
                this.numberofparticles=3000;
                this.cellsize=6;
                this.rows;
                this.cols;
                this.curve=5.9;
                this.zoom=0.05;
                this.debug=false;
                this.photo=document.getElementById("photo");
                this.init();
                window.addEventListener("keydown", e => {
                    if (e.key==="d") this.debug=!this.debug;
                })

                // window.addEventListener("resize", e => {
                //     // this.resize(e.target.innerWidth,e.target.innerHeight);
                // })

            }
            init()
            {
                this.rows=Math.floor(canvas.height/this.cellsize);
                this.cols=Math.floor(canvas.width/this.cellsize);
                this.flowfield=[];
                // this.drawtext();
                this.drawphoto();
                this.count=0;
                const pixeldata=this.ctx.getImageData(0,0,this.width,this.height).data;
                console.log(pixeldata);

                for(let i =0 ; i<this.height; i+=this.cellsize)
                {
                    for(let j=0; j<this.width; j+=this.cellsize)
                    {
                        let index = ((i + this.cellsize / 2) * this.width + (j + this.cellsize / 2)) * 4;
                        //changed index for claude
                        // let index = (i*this.width + j)*4;
                        const red=pixeldata[index];
                        const green=pixeldata[index+1];
                        const blue= pixeldata[index+2];
                        const alpha=pixeldata[index+3];
                        const grayscale = (red+green+blue)/3 ;
                        if(grayscale!=0) this.count++;
                        let colortoangle=((grayscale/255)*6.28).toFixed(2);
                        
                        // if (colortoangle<1.2)
                        //         colortoangle=0;
                        //green colortoangle 1.03 found from data
                        //red colortoangle 2.03
                        this.flowfield.push({
                            x:j,
                            y:i,
                            red:red,
                            green:green,
                            blue:blue,
                            colortoangle:colortoangle,
                            alpha:alpha
                        });
                    }
                }
                console.log(this.flowfield);
                console.log(this.count);
                
                
                //old method of calculating flow field from coordinates
                // for(let i =0; i<this.rows;i++)
                // {
                //     for(let j=0 ; j<this.cols ; j++)
                //     {
                //         let angle= Math.cos(i*this.zoom)+Math.sin(j*this.zoom)*this.curve;
                //         this.flowfield.push(angle);
                //     }
                // }
                this.particles=[]
                
                for(let i=0;i<this.numberofparticles;i++)
                    {
                        this.particles.push(new Particle(this));
                    }

                
                
            }

            drawtext()
            {

                this.ctx.save();
                this.ctx.font="450px Impact";
                this.ctx.textAlign="center";
                
                const gradient1=this.ctx.createLinearGradient(0,0,this.width,this.height);
                gradient1.addColorStop(0.3,"rgb(0,255,0)");
                gradient1.addColorStop(0.5,"rgb(255,0,30)");
                gradient1.addColorStop(0.7,"rgb(150,100,100)");
                gradient1.addColorStop(0.9,"rgb(0,255,255)");


                const gradient2 = this.ctx.createRadialGradient(this.width*0.5,this.height*0.5,10,this.width*0.5,this.height*0.5,this.width);
                gradient2.addColorStop(0.2,"rgb(0,0,255)");
                gradient2.addColorStop(0.4,"rgb(200,255,0)");
                gradient2.addColorStop(0.6,"rgb(0,0,255)");
                gradient2.addColorStop(0.8,"rgb(0,0,0)");

                
                this.ctx.fillStyle=gradient2;
                this.ctx.textBaseline="middle";
                this.ctx.fillText("JS", this.canvas.width*0.5,this.canvas.height*0.5,this.width);

                
                this.ctx.restore();
            }

            drawgrid()
            {
                this.ctx.save();
                this.ctx.lineWidth=0.3;
                this.ctx.strokeStyle="white";

                for(let p=0;p<=this.width;p+=this.cellsize)
                {
                    this.ctx.beginPath();
                    this.ctx.moveTo(p,0);
                    this.ctx.lineTo(p,this.height);
                    this.ctx.stroke();
                }

                for(let q=0;q<=this.height;q+=this.cellsize)
                    {
                        this.ctx.beginPath();
                        this.ctx.moveTo(0,q);
                        this.ctx.lineTo(this.width,q);
                        this.ctx.stroke();
                    }
                this.ctx.restore();

            }

            //added from claude to visualize flow field
            drawFlowField() {
                this.ctx.save();
                this.ctx.strokeStyle = 'rgba(255, 252, 127, 1)';
                console.log("foirce field bana raha hoon");
                for (let cell of this.flowfield) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(cell.x, cell.y);
                    this.ctx.lineTo(cell.x + Math.cos(cell.colortoangle) * 6, cell.y + Math.sin(cell.colortoangle) * 6);
                    this.ctx.stroke();
                }
                this.ctx.restore();
            }

            drawphoto()
            {

                let photosize=this.width*0.6;
                this.ctx.drawImage(this.photo,this.width*0.5-photosize*0.5,this.height*0.5-photosize*0.5,photosize,photosize);

            }
            resize(width,height)
            {
                this.canvas.width=width;
                this.canvas.height=height;
                this.width=this.canvas.width;
                this.height=this.canvas.height;
                this.init();
                
            }

            render(){
                
                if(this.debug) {
                    this.drawgrid();
                    // this.drawtext();
                    this.drawphoto();
                    // this.drawFlowField();
                    // this.init();
                }
                
                this.particles.forEach(particle=>{
                    // particle.reset();
                    particle.draw(this.ctx);
                    particle.update();
                })
                
            }

        }


        const effect=new Effect(canvas,ctx);

        function animate()
        {
            ctx.clearRect(0,0,canvas.width,canvas.height);
            effect.render();
            requestAnimationFrame(animate);
        }

        animate();