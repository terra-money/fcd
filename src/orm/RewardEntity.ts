import { Column, Entity, PrimaryGeneratedColumn, Index } from 'typeorm'

@Entity('reward')
@Index('index_reward_with_denom_and_date', ['denom', 'datetime'], { unique: true })
export default class RewardEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number

  @Index('index_reward_denom')
  @Column()
  denom: string

  @Index('index_reward_datetime')
  @Column()
  datetime: Date

  @Column('decimal', { precision: 40, scale: 10 })
  fee: string

  @Column({ type: 'decimal', precision: 40, scale: 10, nullable: true })
  reward: string

  @Column({ type: 'decimal', precision: 40, scale: 10, nullable: true })
  commission: string
}
