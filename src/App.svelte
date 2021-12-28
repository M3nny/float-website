<script>
	import Typewriter from 'svelte-typewriter';
	let background;
	let floating_island;
	let grass;
	let text;

	window.addEventListener('scroll', function(){
		var value = window.scrollY;

		background.style.top = value * 0.5 + 'px';
		floating_island.style.left = -value * 0.5 + 'px';
		grass.style.top = value * 0.15 + 'px';
		text.style.top = value * 1 + 'px';

	})
</script>

<main>
	<section>
		<img bind:this={background} src="images/background.png" id="bg" alt = "background">
		<img bind:this={floating_island} src="images/floating_island.png" id="floating_island" alt = "floating_island">
		<img bind:this={grass} src="images/grass.png" id="grass" alt = "grass">

		<Typewriter interval={200}>
			<h2 bind:this={text} id="text">Welcome</h2>
		</Typewriter>
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
		background: #ff7d57;
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
		height: 50px;
		background: linear-gradient(to top, #ff7d57, transparent);
		z-index: 10000;
	}

	section:after {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
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

	#grass {
		z-index: 2;
	}
</style>
