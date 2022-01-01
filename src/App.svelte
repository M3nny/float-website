<script>
	import Typewriter from 'svelte-typewriter';
	import { fly } from 'svelte/transition';
	import { fade } from 'svelte/transition';
	

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

		<Typewriter interval={150} cursor={false}>
			<h2 bind:this={text} id="text">Welcome</h2>
		</Typewriter>
	</section>

	<div class="font-9xl flex flex-wrap justify-center my-8">
		<div>asd</div>
		<div>
			<img src="images/bot_icon.png" alt="bi" class=" mx-auto object-contain h-48 w-96" />
		<div>

		<h1 class="text-center" style="font-size: 50px;">Float</h1>
		<h2 class="text-center" style="font-size: 35px;">music bot for discord</h2>	
	</div>
	
	<div class="h-56 grid grid-cols-3 gap-4 content-center">
		<div transition:fly="{{x: -500, duration: 1000, delay: 2000}}">
			<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
			</svg>
			<p class="text-xl">Simple and easy</p>
			<p>Only a few commands <br> without any distractions.</p>
		</div>

		<div transition:fly="{{y: 500, duration: 1000, delay: 2000}}">
			<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
			</svg>
			<p class="text-xl">Anti-afk</p>
			<p>Float leaves the room automatically <br> after being inactive for a period of time.</p>
		</div>

		<div transition:fly="{{x: 500, duration: 1000, delay: 2000}}">
			<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
			</svg>
			<p class="text-xl">Music from youtube like no others</p>
			<p>The music is streamed from youtube <br> providing a fast experience.</p>
		</div>

		<div></div>

		<div transition:fade="{{duration: 2000, delay: 2500}}">
			<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
			</svg>
			<p class="text-xl">Slash commands</p>
			<p>Write commands faster <br> using the slashed notation.</p>
		</div>
	</div>	


	
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
		min-height: 3000px;
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
