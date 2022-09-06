import { CommandContext, CommandModule, CommandResult } from "../Command.ts";

import { run_code } from "../apis/emkc.ts";

const Kappa: CommandModule = {
	sufficient_privilege: 0,

	async execute(ctx: CommandContext): Promise<CommandResult> {
		// adapted from https://go.dev/play/p/n1aZ2TIDVwt
		const code = `
			package main
			
			import (
				\"fmt\"
				\"hash\"
				\"time\"
			)

			func main() {
				day := time.Now()
				for i := 0; i < 100000; i++ {
					day = day.Add(time.Hour * 24)
					sod := day.Truncate(24 * time.Hour).Unix()
					hash := NewJenkins32()
					hash.Write([]byte(fmt.Sprintf(\"%d:%d\", ${ctx.caller.id}, sod)))
					if hash.Sum32()%100000 == 0 {
						fmt.Println(day.Truncate(time.Hour*24).Format("January 02, 2006"))
						return
					} else if hash.Sum32()%10000 == 0 {
						fmt.Println(day.Truncate(time.Hour*24).Format("January 02, 2006"), \"(TURBO ONLY)\")
						return
					}
				}
			}
			type jenkinsStringHash32 uint32
			func NewJenkins32() hash.Hash32 {
				var s = jenkinsStringHash32(0)
				return &s
			}
			func (sh *jenkinsStringHash32) Size() int      { return 4 }
			func (sh *jenkinsStringHash32) BlockSize() int { return 1 }
			func (sh *jenkinsStringHash32) Reset()         { *sh = jenkinsStringHash32(0) }
			func (sh *jenkinsStringHash32) Write(b []byte) (int, error) {
				h := uint32(*sh)
				for _, c := range b {
					h += uint32(c)
					h += (h << 10)
					h ^= (h >> 6)
				}
				*sh = jenkinsStringHash32(h)
				return len(b), nil
			}
			func (sh *jenkinsStringHash32) Sum32() uint32 {
				h := uint32(*sh)

				h += (h << 3)
				h ^= (h >> 11)
				h += (h << 15)

				return h
			}
			func (sh *jenkinsStringHash32) Sum(b []byte) []byte {
				v := sh.Sum32()
				return append(b, byte(v>>24), byte(v>>16), byte(v>>8), byte(v))
			}
		`;

		const result = await run_code("go", code);
		if (result.status !== 200) return {
			is_success: false,
			output: `something went wrong FeelsDankMan . Please try again later.`
		}

		return {
			is_success: true,
			output: `the soonest you'll have golden Kappa is on ${result.data!.output}`,
		}
	},

	description(): string {
		return "Get the soonest date you will have a golden Kappa"
	},

	usage(cmd_prefix: string): string {
		return `${cmd_prefix}kappa`;
	}
}

export default Kappa;