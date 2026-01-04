# 🎯 Darts Halve-It Scorer

A single-page web application for scoring the "Halve-It" darts game. No installation required - just open and play!

## 🌐 Play Online

**[Play Now on GitHub Pages](https://p-h-0-x.github.io/halve-it/)**

## ✨ Features

- **🎮 Two Game Modes:**
  - **Classic Mode**: Play contracts in order. Hit the target to add your score, miss to halve your capital!
  - **Yahtzee Style**: Choose where to register your score each turn. Fill or scratch contracts freely.

- **🌍 Multi-Language Support:**
  - English 🇬🇧
  - Français 🇫🇷
  - Español 🇪🇸

- **👥 Multiple Players**: Add as many players as you want

- **📱 Mobile Friendly**: Responsive design works on all devices

- **💾 No Installation**: Pure HTML/CSS/JavaScript - works offline after first load

- **🎨 Modern Dark Theme**: Beautiful gradient design with smooth animations

## 🎲 Game Rules

### Contracts (in order):
1. **Capital** - First 3 darts establish starting score
2. **20** - Hit the 20 segment
3. **Side** - Hit 3 adjacent segments (e.g., 5-20-1)
4. **19** - Hit the 19 segment
5. **3 in a Row** - Hit 3 consecutive numbers (e.g., 14-15-16)
6. **18** - Hit the 18 segment
7. **Color** - Hit 3 different colors (black, white, green, red)
8. **17** - Hit the 17 segment
9. **Double** - Hit any double
10. **16** - Hit the 16 segment
11. **Triple** - Hit any triple
12. **15** - Hit the 15 segment
13. **57** - Score exactly 57 with 3 darts
14. **14** - Hit the 14 segment
15. **Bull** - Hit the bullseye (single 25 or double 50)

### Classic Mode Rules:
- All players play the same contract each round
- Score > 0: Contract fulfilled, score added to capital
- Score = 0: Contract failed, capital is **divided by 2 (rounded up)**
- Winner: Highest capital after 15 rounds

### Yahtzee Style Rules:
- Players take turns one at a time
- Each turn: throw 3 darts, then choose ANY available contract to fill OR scratch
- Fill: Enter your score in that contract (adds to total)
- Scratch: Voluntarily give up a contract (scores 0)
- Game ends when all contracts are filled/scratched
- Winner: Highest total score

## 🚀 Quick Start

1. **Online**: Visit [https://p-h-0-x.github.io/halve-it/](https://p-h-0-x.github.io/halve-it/)

2. **Offline**: Download `index.html` and open it in any web browser

3. **Local Development**: Clone this repository and open `index.html`

```bash
git clone https://github.com/p-h-0-x/halve-it.git
cd halve-it
# Open index.html in your browser
```

## 🛠️ Tech Stack

- **Pure HTML5** - Single file application
- **CSS3** - Modern styling with flexbox/grid, gradients, and transitions
- **Vanilla JavaScript** - No frameworks or dependencies
- **Color Scheme**:
  - Background: `#1a1a2e`
  - Accent Red: `#e94560`
  - Accent Blue: `#3282b8`
  - Success Green: `#00b894`

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎯 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests
- Translate to additional languages

## 🏆 Acknowledgments

Built for darts enthusiasts who want a simple, fast, and beautiful way to score their Halve-It games!

---

**Enjoy the game! 🎯**
