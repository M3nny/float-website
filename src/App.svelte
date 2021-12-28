<script>
	let bg;
	let moon;
	let mountain;
	let road;
	let text;

	window.addEventListener('scroll', function(){
		var value = window.scrollY;

		bg.style.top = value * 0.5 + 'px';
		moon.style.left = -value * 0.5 + 'px';
		mountain.style.top = -value * 0.15 + 'px';
		road.style.top = value * 0.15 + 'px';
		text.style.top = value * 1 + 'px';

	})
</script>

<main>
	<section>
		<img bind:this={bg} src="images/bg.jpg" id="bg" alt = "bg">
		<img bind:this={moon} src="images/moon.png" id="moon" alt = "bg">
		<img bind:this={mountain} src="images/mountain.png" id="mountain" alt = "bg">
		<img bind:this={road} src="images/road.png" id="road" alt = "bg">
		<h2 bind:this={text} id="text">Moon Light</h2>
	</section>
</main>



<style lang="postcss" global>
	@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@600&display=swap');
	@tailwind base;
	@tailwind components;
	@tailwind utilities;
	

	* {
		margin: 0;
		padding: 0;
		font-family: 'Poppins', sans-serif;
	}

	main {
		background: #0a2a43;
		min-height: 1500px;
	}

	section {
		position: relative;
		width: 100%;
		height: 100vh;
		overflow: hidden;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	section:before {
		content: '';
		position: absolute;
		bottom: 0;
		width: 100%;
		height: 100px;
		background: linear-gradient(to top, #0a2a43, transparent);
		z-index: 10000;
	}

	section:after {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: #0a2a43;
		z-index: 10000;
		mix-blend-mode: color;

	}

	section img {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		pointer-events: none;
	}

	#text {
		position: relative;
		color: #fff;
		font-size: 10em;
		z-index: 1;
	}

	#road {
		z-index: 2;
	}
</style>
